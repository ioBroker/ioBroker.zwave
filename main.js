/**
 *      CCU.IO Z-Wave Adapter
 *
 *      sudo apt-get install libudev-dev
 *
 *      License: LGPL
 */
if (yargs.argv._[0] == '--install') {
    // If install
    var spawn = require('child_process').spawn;
    var args = ['apt-get', 'install', 'libudev-dev'];
    logger.info('ZWave install ' + args.slice(1).join(' '));

    var child = spawn('sudo', args);
    child.stdout.on('data', function (data) {
        console.log(data);
    });
    child.stderr.on('data', function (data) {
        console.log('ERROR| ' + data);
    });

    child.on('exit', function (exitCode) {
        console.log('ZWave install exit ' + exitCode);
        process.exit();
    });
} else {
    // Normal run
    var OZW = require('./node_modules/openzwave/lib/openzwave.js');

    var zwave;
    var objects = {};
    var scanComplete = 0;

    var adapter = require(__dirname + '/../../lib/adapter.js')({

        name: 'zwave',

        objectChange: function (id, obj) {

        },

        stateChange: function (id, state) {
            if (state.ack) return;

            if (!objects[id]) {
                adapter.log.warn('Object ' + id + ' not found');
                return;
            }
            /*
             var mask = 0xff;

             var nodeid   = mask & (id - settings.adapters.zwave.firstId) >>> 16;
             var comclass = mask & (id - settings.adapters.zwave.firstId) >>> 8;
             var idx      = mask & (id - settings.adapters.zwave.firstId);
             */
            if (scanComplete) {
                zwave.setLevel(objects[id].nodeid, state.val);
                adapter.log.debug('Event nodeid=%d: comclass=%d: index=%d: value=%d', objects[id].nodeid, objects[id].comclass, objects[id].idx, state.val);
            }
        },

        unload: function (callback) {
            if (zwave) zwave.disconnect();
            callback();
        },

        ready: function () {
            main();
        }

    });
}

function calcName(nodeid, comclass, idx) {
    var name = adapter.namespace + ".NODE" + nodeid;
    if (comclass) {
        name += ".CLASSES" + comclass;

        if (idx !== undefined) {
            name = 'io.' + name + '.' + idx;
        }
    }
    return name;
}

function main() {

    zwave = new OZW('/dev/' + adapter.config.usb, {
        logging:         true,    // enable logging to OZW_Log.txt
        consoleoutput:   true,    // copy logging to the console
        saveconfig:      true,    // write an XML network layout
        driverattempts:  3,       // try this many times before giving up
        pollinterval:    500,     // interval between polls in milliseconds
        suppressrefresh: false    // do not send updates if nothing changed
    });

    var nodes = [];

    zwave.on('driver ready', function (homeid) {
        adapter.log.info('scanning homeid=0x%s...', homeid.toString(16));
        //adapter.states.setState('system.adapter.' + adapter.namespace + '.connected', {val: true, ack: true});
    });

    zwave.on('driver failed', function () {
        adapter.log.error('failed to start driver');
        zwave.disconnect();
        process.exit();
    });

    zwave.on('node added', function (nodeid) {
        nodes[nodeid] = {
            manufacturer:   '',
            manufacturerid: '',
            product:        '',
            producttype:    '',
            productid:      '',
            type:           '',
            name:           '',
            loc:            '',
            classes:        {},
            ready:          false
        };
    });

    zwave.on('value added', function (nodeid, comclass, value) {
        var name = calcName(nodeid, comclass, value.label);


        // Should the object be added too??
        adapter.log.debug('Value    added: ' + name + ' = ' + value.value);

        nodes[nodeid].classes[comclass] = nodes[nodeid].classes[comclass] || {};
        nodes[nodeid].classes[comclass][value.index] = value;
        adapter.setState(name, {val: value.value, ack: true});
        //socket.emit("setState", [settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)), value.value]);
    });

    zwave.on('value changed', function (nodeid, comclass, value) {
        if (nodes[nodeid].ready) {
            var name = calcName(nodeid, comclass, value.label);
            adapter.log.debug('Value changed: ' + name + ' from ' + nodes[nodeid].classes[comclass][value.index].value + ' to ' + value.value);
            adapter.setState(name, {val: value.value, ack: true});
            //socket.emit("setState", [settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)), value.value]);

        }
        nodes[nodeid].classes[comclass][value.index] = value;
    });

    zwave.on('value removed', function (nodeid, comclass, index) {
        var name = calcName(nodeid, comclass, nodes[nodeid].classes[comclass][index].label);
        if (nodes[nodeid].classes[comclass] && nodes[nodeid].classes[comclass][index]) {
            adapter.delObject(name);
            delete nodes[nodeid].classes[comclass][index];
        }
        adapter.log.info('Value removed: ' + name);

        if (objects[name]) delete objects[name];
    });

    zwave.on('node ready', function (nodeid, nodeinfo) {
        nodes[nodeid].manufacturer   = nodeinfo.manufacturer;
        nodes[nodeid].manufacturerid = nodeinfo.manufacturerid;
        nodes[nodeid].product        = nodeinfo.product;
        nodes[nodeid].producttype    = nodeinfo.producttype;
        nodes[nodeid].productid      = nodeinfo.productid;
        nodes[nodeid].type           = nodeinfo.type;
        nodes[nodeid].name           = nodeinfo.name;
        nodes[nodeid].loc            = nodeinfo.loc;
        nodes[nodeid].ready          = true;
        nodes[nodeid].nodeid         = nodeid;
        //console.log(JSON.stringify(nodes[nodeid]));

        adapter.log.debug('node%d: %s, %s', nodeid,
            nodeinfo.manufacturer ? nodeinfo.manufacturer : 'id=' + nodeinfo.manufacturerid,
            (nodeinfo.product ? nodeinfo.product :
                'product=' + nodeinfo.productid + ', type=' + nodeinfo.producttype));

        adapter.log.debug('node%d: name="%s", type="%s", location="%s"',
            nodeid,
            nodeinfo.name,
            nodeinfo.type,
            nodeinfo.loc);

        var combined = (nodeid << 16);
        /*
         socket.emit("setObject", settings.adapters.zwave.firstId + combined, {
         Name: adapterSettings.deviceName+".NODE"+nodeid,
         TypeName: "CHANNEL",
         Address: adapterSettings.deviceName+".NODE"+nodeid,
         HssType: "ZWAVE-NODE",
         Parent: settings.adapters.zwave.firstId,
         _persistent: true
         });
         */
        // Create channel
        var devName = calcName(nodeid);
        var channels = [];
        for (var comclass in nodes[nodeid].classes) {
            var chName = calcName(nodeid, comclass);
            var DPs = [];
            channels.push(chName);

            switch (comclass) {
                case 0x25: // COMMAND_CLASS_SWITCH_BINARY
                case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
                    zwave.enablePoll(nodeid, comclass);
                    break;
            }

            var values = nodes[nodeid].classes[comclass];

            for (var idx in values) {
                var name = calcName(nodeid, comclass, values[idx].label);
                objects[name] = {
                    nodeid:   idx,
                    comclass: comclass,
                    idx:      idx,
                    label:    values[idx].label
                };
                DPs.push(name);
                values[idx].comclass = comclass;
                values[idx].nodeid   = nodeid;
                values[idx].index    = idx;

                adapter.addObject(name, {
                    common: {
                        name:  name, // You can add here some description
                        type:  '??',
                        role:  'state',
                        read:  true,
                        write: true
                    },
                    native: values[idx],
                    parent: chName,
                    type:   'state'
                });
            }

            adapter.addObject(chName, {
                common: {
                    name:  chName, // You can add here some description
                    type:  '??',
                    role:  'state',
                    read:  true,
                    write: true
                },
                native: {
                    comclass: comclass,
                    nodeid:   nodeid
                },
                children: DPs,
                type: 'channel'
            });
        }

        nodes[nodeid].nodeid = nodeid;
        adapter.addObject(devName, {
            common: {
                name:  devName, // You can add here some description
                type:  '??',
                role:  'state',
                read:  true,
                write: true
            },
            native:   nodes[nodeid],
            children: channels,
            type:     'device'
        });
    });

    zwave.on('notification', function (nodeid, notif) {
        switch (notif) {
            case 0:
                adapter.log.debug('node%d: message complete', nodeid);
                break;
            case 1:
                adapter.log.warn('node%d: timeout', nodeid);
                break;
            case 2:
                adapter.log.info('node%d: nop', nodeid);
                break;
            case 3:
                adapter.log.info('node%d: node awake', nodeid);
                break;
            case 4:
                adapter.log.info('node%d: node sleep', nodeid);
                break;
            case 5:
                adapter.log.warn('node%d: node dead', nodeid);
                break;
            case 6:
                adapter.log.info('node%d: node alive', nodeid);
                break;
        }
    });

    zwave.on('scan complete', function () {
        scanComplete = 1;
        adapter.log.info('Scan completed');
    });

    zwave.connect();
}



