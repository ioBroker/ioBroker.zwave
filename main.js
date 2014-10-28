/**
 *      CCU.IO Z-Wave Adapter
 *
 */

var OZW = require('./node_modules/openzwave/lib/openzwave.js');

var zwave;
var objects = {};
//var metaRoles = {};
var scanComplete = 0;

var adapter = require(__dirname + '/../../lib/adapter.js')({

    name: 'zwave',

    objectChange: function (id, obj) {

    },

    stateChange: function (id, state) {
        if (state.ack) return;

        var mask = 0xff;

        var nodeid   = mask & (id - settings.adapters.zwave.firstId) >>> 16;
        var comclass = mask & (id - settings.adapters.zwave.firstId) >>> 8;
        var idx      = mask & (id - settings.adapters.zwave.firstId);

        if (scanComplete){
            zwave.setLevel(nodeid, state.val);
            adapter.log.debug('Event nodeid=%d: comclass=%d: index=%d: value=%d', nodeid, comclass, idx, state.val);
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
        console.log('scanning homeid=0x%s...', homeid.toString(16));
        adapter.states.setState('system.adapter.' + adapter.namespace + '.connected', {val: true, ack: true});
    });

    zwave.on('driver failed', function () {
        console.log('failed to start driver');
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
        if (!nodes[nodeid]['classes'][comclass]) {
            nodes[nodeid]['classes'][comclass] = {};
        }
        nodes[nodeid]['classes'][comclass][value.index] = value;
        var idx = value['index'];
        //socket.emit("setState", [settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)), value['value']]);

    });

    zwave.on('value changed', function (nodeid, comclass, value) {
        if (nodes[nodeid]['ready']) {
            var idx = value['index'];
            console.log('node%d: changed: %d:%s:%s->%s: index=%d: date=%s', nodeid, comclass,
                value['label'],
                nodes[nodeid]['classes'][comclass][value.index]['value'],
                value['value'], idx, getDateTime());


            //socket.emit("setState", [settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)), value['value']]);

            console.log('ValueChanged=%s: ID=%d', adapterSettings.deviceName + ".NODE" + nodeid + ".CLASSES" + comclass, settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)));
        }
        nodes[nodeid]['classes'][comclass][value.index] = value;
    });

    zwave.on('value removed', function (nodeid, comclass, index) {
        if (nodes[nodeid]['classes'][comclass] && nodes[nodeid]['classes'][comclass][index]) {
            delete nodes[nodeid]['classes'][comclass][index];
        }
    });

    zwave.on('node ready', function (nodeid, nodeinfo) {
        nodes[nodeid]['manufacturer']   = nodeinfo.manufacturer;
        nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
        nodes[nodeid]['product']        = nodeinfo.product;
        nodes[nodeid]['producttype']    = nodeinfo.producttype;
        nodes[nodeid]['productid']      = nodeinfo.productid;
        nodes[nodeid]['type']           = nodeinfo.type;
        nodes[nodeid]['name']           = nodeinfo.name;
        nodes[nodeid]['loc']            = nodeinfo.loc;
        nodes[nodeid]['ready']          = true;
        //console.log(JSON.stringify(nodes[nodeid]));

        console.log('node%d: %s, %s', nodeid,
            nodeinfo.manufacturer ? nodeinfo.manufacturer : 'id=' + nodeinfo.manufacturerid,
            (nodeinfo.product ? nodeinfo.product :
                'product=' + nodeinfo.productid + ', type=' + nodeinfo.producttype));

        console.log('node%d: name="%s", type="%s", location="%s"',
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

        for (comclass in nodes[nodeid]['classes']) {
            switch (comclass) {
                case 0x25: // COMMAND_CLASS_SWITCH_BINARY
                case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
                    zwave.enablePoll(nodeid, comclass);
                    break;
            }

            var values = nodes[nodeid]['classes'][comclass];

            for (idx in values){
                // var idd = idx + 1;
                /*
                 socket.emit("setObject", settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)), {
                 "Name": adapterSettings.deviceName + ".NODE" + nodeid + ".CLASSES" + comclass + "." + values[idx]['label'],
                 "TypeName": "HSSDP",
                 "Operations": 5,
                 "ValueType": 4,
                 "ValueUnit": values[idx]['units'],
                 "Parent": settings.adapters.zwave.firstId+(nodeid << 16),
                 _persistent: true

                 });
                 */
            }
        }
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
