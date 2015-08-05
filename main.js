/**
 *      CCU.IO Z-Wave Adapter
 *
 *      sudo apt-get install libudev-dev
 *
 *      License: GNU LGPL
 */

var zwave;
var objects =           {};
var zobjects =          {};
var states =            {};
var enums =             [];
var scanComplete = 0;

var adapter;

var allConfigs = {};

function parseProductConfig(product, callback) {
    var xml2object = require('xml2object');
    var fs = require('fs');
    var done;

    var productConfig = product.productConfig;
    var ID = product.ID;
    var TYPE = product.TYPE;
    var productName =  product.productName;

    var productSource = fs.createReadStream(productConfig);
    var productParser = new xml2object(['CommandClass'], productSource);

    productParser.start();

    productParser.on('end', function () {
        done = true;
    });

    productParser.on('object', function (name, obj) {
        if (obj.id == "112") {
            for (var v in obj.Value) {
                var oValue = obj.Value[v];
                var help = oValue.Help;
                var instance = oValue.instance;
                var index = oValue.index;
                var label = oValue.label;
                var type = oValue.type;
                var value = oValue.value;
                var size = oValue.size;
                var genre = oValue.genre;
                if (type == "list") {
                    var Items = oValue.Item;

                    var key = 'zwave.meta.VALUES.' + productName + "." + ID + "." + TYPE + "." + label.replace(/\./g, '_');
                    var paramset = {
                        'type': 'meta',
                        'meta': {
                            adapter: 'zwave',
                            type: 'paramsetDescription'
                        },
                        'common': {},
                        'native': Items
                    };
                    adapter.log.debug('setObject ' + key);
                    adapter.objects.setObject(key, paramset);
                }
            }
        }
        if (done && typeof callback === 'function') callback();
    });
}
function parseManufacturerConfig() {
    var xml2object = require('xml2object');
    var fs = require('fs');

    var ozw_configPath = __dirname + "/config/openzwave/";
    var manufacturerConfig = ozw_configPath + "manufacturer_specific.xml";

    var source = fs.createReadStream(manufacturerConfig);
    var parser = new xml2object([ 'Manufacturer' ], source);

    parser.on('object', function(name, obj) {
        var productName = obj.name; //.replace(/ /g, '_');
        for (var p in obj.Product) {
            var product = obj.Product[p];

            if (product.config != undefined) {
                var productConfig = ozw_configPath + product.config;

                allConfigs[productName+productConfig+product.id+product.type] = {productConfig: productConfig, ID: product.id, TYPE: product.type, productName: productName};
            }
        }
    });

    parser.start();

    parser.on('end', function() {
        adapter.log.debug('Finished parsing xml!');

        for (var c in allConfigs) {
            var product = allConfigs[c];

            parseProductConfig(product, function() {
                adapter.log.debug("done");
            });
        }
    });
}

if (process.argv[2] == '--install') {
    // If install
    var spawn = require('child_process').spawn;
    var args = ['apt-get', 'install', 'libudev-dev'];
    console.log('ZWave: ' + args.slice(1).join(' '));

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
    var utils =   require(__dirname + '/lib/utils'); // Get common adapter utils
    adapter = utils.adapter('zwave');

    adapter.on('objectChange', function (id, obj) {
        adapter.log.debug("objectChange for " + id + " found");

        var diff = require('deep-diff').diff;
        var object = objects[id];
        var differences = diff(object, obj);
        adapter.log.debug(JSON.stringify(differences));

        // We must inform zwave that something has changed
        // TODO: Currently only Fully Qualified Object is working (e.g. zwave.0.NODE7.CONFIGURATION.Enable/Disable ALL ON/OFF)
        adapter.setState(id, {
            val: {
                nodeid: obj.native.nodeid,
                action:"changeConfig",
                paramId: obj.native.index,
                paramValue: obj.native.value,
                label: obj.native.label,
                index: obj.native.index,
                comclass: obj.native.comclass,
                changed: true
            },
            ack: true});
    });

    adapter.on('stateChange', function (id, state) {
        adapter.log.debug("ID: " + id + ", state: " + JSON.stringify(state));

        var obj = objects[id];
        if (obj != undefined) {
            if (obj.native != undefined) {
                // Todo: Use NodeReady instead of scanComplete
                if (scanComplete) {
                    if (state.val.action != undefined && state.val.nodeid != undefined) {
                        if (state.val.name != undefined) {
                            var action = state.val.action;
                            if (action == "setName") {
                                var nodeid = state.val.nodeid;
                                var name = state.val.name;
                                zwave.setName(nodeid, name);
                                var old_type = obj.type;
                                var old_native = obj.native;
                                var old_common = obj.common;
                                old_native.name = name;
                                var objx = {type: old_type, native: old_native, common: old_common};

                                adapter.setObject(adapter.namespace + ".NODE" + nodeid, objx);
                            }
                            if (action == "setLocation") {
                                var nodeid = state.val.nodeid;
                                var location = state.val.name;
                                zwave.setLocation(nodeid, location);
                                var old_type = obj.type;
                                var old_native = obj.native;
                                var old_common = obj.common;
                                old_native.loc = location;
                                var objx = {type: old_type, native: old_native, common: old_common};

                                adapter.setObject(adapter.namespace + ".NODE" + nodeid, objx);
                            }
                        } else if (state.val.paramId != undefined &&
                            state.val.paramValue != undefined &&
                            state.val.label != undefined &&
                            state.val.comclass != undefined &&
                            state.val.index != undefined) {
                            var action = state.val.action;

                            var nodeid = state.val.nodeid;
                            var paramId = state.val.paramId;
                            var paramValue = state.val.paramValue;
                            var label = state.val.label.replace(/\./g, '_'); //.replace(/ /g, '_')
                            var comclass = state.val.comclass;
                            var index = state.val.index;
                            var changed = state.val.changed;

                            var old_type = obj.type;
                            var old_native = obj.native;
                            var old_common = obj.common;

                            var old_value = obj.native.value;

                            if (action == "changeConfig") {
                                adapter.log.debug("setConfigParam for " + id + ", paramId = " + paramId + ", paramValue = " + paramValue);
                                // TODO:
                                zwave.setConfigParam(nodeid, paramId, paramValue, paramValue.length);
                                old_native.value = paramValue;

                                adapter.log.debug("setObject for " + id + ", label = " + label);
                                var objx = {type: old_type, native: old_native, common: old_common};
                                var address = adapter.namespace + ".NODE" + nodeid;

                                if (changed == undefined) {
                                    adapter.setObject(address + ".CONFIGURATION." + label, objx);
                                }

                                // TODO: We must set Root Object too...
                                var rootObject = objects[address];
                                if (rootObject != undefined) {
                                    var root_type = rootObject.type;
                                    var root_native = rootObject.native;
                                    var root_common = rootObject.common;
                                    var objr = {type: root_type, native: root_native, common: root_common};
                                    root_native.classes[comclass][index].value = paramValue;
                                }
                                if (changed == undefined) {
                                    adapter.setObject(address, objr);
                                }

                            } else if (action == "changeSystem") {
                                /*
                                // TODO: Check if this is working
                                adapter.log.debug("setSystemParam for " + id + ", paramId = " + paramId + ", paramValue = " + paramValue);
                                // TODO: zwave.setConfigParam(nodeid, paramId, paramValue, paramValue.length);
                                old_native.value = paramValue;
                                */

                                // TODO:
                                zwave.setValue(obj.native.nodeid, obj.native.comclass, obj.native.index, obj.native.instance, state.val);

                                adapter.log.debug("setObject for " + id + ", label = " + label);
                                var objx = {type: old_type, native: old_native, common: old_common};
                                adapter.setObject(adapter.namespace + ".NODE" + nodeid + ".CONFIGURATION." + label, objx);
                            }
                        }
                    } else {
                        var value;
                        if (state.val == true) {
                            value = 0;
                        } else if (state.val == false) {
                            value = 1;
                        }
                        zwave.setValue(obj.native.nodeid, obj.native.comclass, obj.native.index, obj.native.instance, state.val);
                        adapter.log.debug('setState for: nodeid='+obj.native.nodeid+': comclass='+obj.native.comclass+': index='+obj.native.index+': instance='+obj.native.instance+': value='+state.val);
                    }
                }
            }
        } else {
            adapter.log.error("Object '"+id+"' not found for stateChange");
        }
    });

    adapter.on('unload', function (callback) {
        if (zwave) zwave.disconnect();

        var allNodes = adapter.states.getStates(adapter.namespace + ".NODE*");
        var nodeid;
        for (var node in allNodes) {
            var rName = adapter.namespace + ".NODE" + nodeid + ".ready";
            adapter.setState(rName, {val: false, ack: true});
        }
        callback();
    });

    adapter.on('ready', function () {
        // TODO: Remove Function, no longer needed
        // parseManufacturerConfig();
        getData(function () {
            adapter.subscribeObjects('*');
            adapter.subscribeStates('*');

            main();
        });
    });
}

function getData(callback) {
    var statesReady;
    var objectsReady;

    adapter.log.info('requesting all states');
    adapter.getForeignStates('*', function (err, res) {
        states = res;
        statesReady = true;
        adapter.log.info('received all states');
        if (objectsReady && typeof callback === 'function') callback();
    });
    adapter.log.info('requesting all objects');

    adapter.objects.getObjectList({include_docs: true}, function (err, res) {
        res = res.rows;
        objects = {};
        for (var i = 0; i < res.length; i++) {
            objects[res[i].doc._id] = res[i].doc;
            if (res[i].doc.type === 'enum') enums.push(res[i].doc._id);
        }

        objectsReady = true;
        adapter.log.info('received all objects');
        if (statesReady && typeof callback === 'function') callback();
    });
}

var comclasses = {
    /*
     #define BASIC_TYPE_CONTROLLER                           0x01
     #define BASIC_TYPE_STATIC_CONTROLLER                    0x02
     #define BASIC_TYPE_SLAVE                                0x03
     #define BASIC_TYPE_ROUTING_SLAVE                        0x04

     #define GENERIC_TYPE_GENERIC_CONTROLLER                 0x01
     #define GENERIC_TYPE_STATIC_CONTROLLER                  0x02
     #define GENERIC_TYPE_AV_CONTROL_POINT                   0x03
     #define GENERIC_TYPE_DISPLAY                            0x06
     #define GENERIC_TYPE_GARAGE_DOOR                        0x07
     #define GENERIC_TYPE_THERMOSTAT                         0x08
     #define GENERIC_TYPE_WINDOW_COVERING                    0x09
     #define GENERIC_TYPE_REPEATER_SLAVE                     0x0F
     #define GENERIC_TYPE_SWITCH_BINARY                      0x10

     #define GENERIC_TYPE_SWITCH_MULTILEVEL                  0x11
     #define SPECIFIC_TYPE_NOT_USED				             0x00
     #define SPECIFIC_TYPE_POWER_SWITCH_MULTILEVEL		     0x01
     #define SPECIFIC_TYPE_MOTOR_MULTIPOSITION		         0x03
     #define SPECIFIC_TYPE_SCENE_SWITCH_MULTILEVEL		     0x04
     #define SPECIFIC_TYPE_CLASS_A_MOTOR_CONTROL		     0x05
     #define SPECIFIC_TYPE_CLASS_B_MOTOR_CONTROL		     0x06
     #define SPECIFIC_TYPE_CLASS_C_MOTOR_CONTROL		     0x07

     #define GENERIC_TYPE_SWITCH_REMOTE                      0x12
     #define GENERIC_TYPE_SWITCH_TOGGLE                      0x13
     #define GENERIC_TYPE_SENSOR_BINARY                      0x20
     #define GENERIC_TYPE_SENSOR_MULTILEVEL                  0x21
     #define GENERIC_TYPE_SENSOR_ALARM			             0xa1
     #define GENERIC_TYPE_WATER_CONTROL                      0x22
     #define GENERIC_TYPE_METER_PULSE                        0x30
     #define GENERIC_TYPE_ENTRY_CONTROL                      0x40
     #define GENERIC_TYPE_SEMI_INTEROPERABLE                 0x50
     #define GENERIC_TYPE_NON_INTEROPERABLE                  0xFF

     #define SPECIFIC_TYPE_ADV_ZENSOR_NET_SMOKE_SENSOR	     0x0a
     #define SPECIFIC_TYPE_BASIC_ROUTING_SMOKE_SENSOR	     0x06
     #define SPECIFIC_TYPE_BASIC_ZENSOR_NET_SMOKE_SENSOR	 0x08
     #define SPECIFIC_TYPE_ROUTING_SMOKE_SENSOR		         0x07
     #define SPECIFIC_TYPE_ZENSOR_NET_SMOKE_SENSOR		     0x09

     #define COMMAND_CLASS_MARK				                 0xef
     #define COMMAND_CLASS_BASIC				             0x20
     #define COMMAND_CLASS_VERSION				             0x86
     #define COMMAND_CLASS_BATTERY				             0x80
     #define COMMAND_CLASS_WAKE_UP                         	 0x84
     #define COMMAND_CLASS_CONTROLLER_REPLICATION          	 0x21
     #define COMMAND_CLASS_SWITCH_MULTILEVEL               	 0x26
     #define COMMAND_CLASS_SWITCH_ALL			             0x27
     #define COMMAND_CLASS_SENSOR_BINARY			         0x30
     #define COMMAND_CLASS_SENSOR_MULTILEVEL			     0x31
     #define COMMAND_CLASS_SENSOR_ALARM			             0x9c
     #define COMMAND_CLASS_ALARM				             0x71
     #define COMMAND_CLASS_MULTI_CMD                         0x8F
     #define COMMAND_CLASS_CLIMATE_CONTROL_SCHEDULE		     0x46
     #define COMMAND_CLASS_CLOCK				             0x81
     #define COMMAND_CLASS_ASSOCIATION			             0x85
     #define COMMAND_CLASS_CONFIGURATION			         0x70
     #define COMMAND_CLASS_MANUFACTURER_SPECIFIC		     0x72
     #define COMMAND_CLASS_APPLICATION_STATUS 		         0x22
     #define COMMAND_CLASS_ASSOCIATION_COMMAND_CONFIGURATION 0x9B
     #define COMMAND_CLASS_AV_CONTENT_DIRECTORY_MD		     0x95
     #define COMMAND_CLASS_AV_CONTENT_SEARCH_MD		         0x97
     #define COMMAND_CLASS_AV_RENDERER_STATUS		         0x96
     #define COMMAND_CLASS_AV_TAGGING_MD			         0x99
     #define COMMAND_CLASS_BASIC_WINDOW_COVERING		     0x50
     #define COMMAND_CLASS_CHIMNEY_FAN			             0x2A
     #define COMMAND_CLASS_COMPOSITE				         0x8D
     #define COMMAND_CLASS_DOOR_LOCK				         0x62
     #define COMMAND_CLASS_ENERGY_PRODUCTION		         0x90
     #define COMMAND_CLASS_FIRMWARE_UPDATE_MD		         0x7a
     #define COMMAND_CLASS_GEOGRAPHIC_LOCATION		         0x8C
     #define COMMAND_CLASS_GROUPING_NAME			         0x7B
     #define COMMAND_CLASS_HAIL				                 0x82
     #define COMMAND_CLASS_INDICATOR				         0x87
     #define COMMAND_CLASS_IP_CONFIGURATION			         0x9A
     #define COMMAND_CLASS_LANGUAGE				             0x89
     #define COMMAND_CLASS_LOCK				                 0x76
     #define COMMAND_CLASS_MANUFACTURER_PROPRIETARY	         0x91
     #define COMMAND_CLASS_METER_PULSE			             0x35
     #define COMMAND_CLASS_METER				             0x32
     #define COMMAND_CLASS_MTP_WINDOW_COVERING		         0x51
     #define COMMAND_CLASS_MULTI_INSTANCE_ASSOCIATION	     0x8E
     #define COMMAND_CLASS_MULTI_INSTANCE			         0x60
     #define COMMAND_CLASS_NO_OPERATION			             0x00
     #define COMMAND_CLASS_NODE_NAMING			             0x77
     #define COMMAND_CLASS_NON_INTEROPERABLE		         0xf0
     #define COMMAND_CLASS_POWERLEVEL			             0x73
     #define COMMAND_CLASS_PROPRIETARY			             0x88
     #define COMMAND_CLASS_PROTECTION			             0x75
     #define COMMAND_CLASS_REMOTE_ASSOCIATION_ACTIVATE	     0x7c
     #define COMMAND_CLASS_REMOTE_ASSOCIATION		         0x7d
     #define COMMAND_CLASS_SCENE_ACTIVATION			         0x2b
     #define COMMAND_CLASS_SCENE_ACTUATOR_CONF		         0x2C
     #define COMMAND_CLASS_SCENE_CONTROLLER_CONF	         0x2D
     #define COMMAND_CLASS_SCREEN_ATTRIBUTES		         0x93
     #define COMMAND_CLASS_SCREEN_MD				         0x92
     #define COMMAND_CLASS_SECURITY				             0x98
     #define COMMAND_CLASS_SENSOR_CONFIGURATION		         0x9E
     #define COMMAND_CLASS_SILENCE_ALARM			         0x9d
     #define COMMAND_CLASS_SIMPLE_AV_CONTROL		         0x94
     #define COMMAND_CLASS_SWITCH_BINARY			         0x25
     #define COMMAND_CLASS_SWITCH_TOGGLE_BINARY		         0x28
     #define COMMAND_CLASS_SWITCH_TOGGLE_MULTILEVEL	         0x29
     #define COMMAND_CLASS_THERMOSTAT_FAN_MODE		         0x44
     #define COMMAND_CLASS_THERMOSTAT_FAN_STATE		         0x45
     #define COMMAND_CLASS_THERMOSTAT_HEATING		         0x38
     #define COMMAND_CLASS_THERMOSTAT_MODE			         0x40
     #define COMMAND_CLASS_THERMOSTAT_OPERATING_STATE	     0x42
     #define COMMAND_CLASS_THERMOSTAT_SETBACK		         0x47
     #define COMMAND_CLASS_THERMOSTAT_SETPOINT		         0x43
     #define COMMAND_CLASS_TIME_PARAMETERS			         0x8B
     #define COMMAND_CLASS_TIME				                 0x8a
     #define COMMAND_CLASS_USER_CODE				         0x63
     #define COMMAND_CLASS_ZIP_ADV_CLIENT			         0x34
     #define COMMAND_CLASS_ZIP_ADV_SERVER			         0x33
     #define COMMAND_CLASS_ZIP_ADV_SERVICES			         0x2F
     #define COMMAND_CLASS_ZIP_CLIENT			             0x2e
     #define COMMAND_CLASS_ZIP_SERVER			             0x24
     #define COMMAND_CLASS_ZIP_SERVICES			             0x23
     */

0x20:{name: 'BASIC',                                  role: 'switch', children: {
    Basic: {role: 'level'}
}},
0x86:{name: 'VERSION',                                role: 'meta.version', children: {
    'Library Version':    {type: 'text'},
    'Protocol Version':   {type: 'text'},
    'Application Version':{type: 'text'}
}},
0x80:{name: 'BATTERY',                                role: 'info', children: {
    'Battery Level':    {role: 'value.battery'}
}},
0x84:{name: 'WAKE_UP',                                role: ''},
0x21:{name: 'CONTROLLER_REPLICATION',                 role: ''},
0x26:{name: 'SWITCH_MULTILEVEL',                      role: 'light.dimmer', children: {
    Level: {role: 'level.dimmer'}
}},
0x27:{name: 'SWITCH_ALL',                             role: ''},
0x30:{name: 'SENSOR_BINARY',                          role: 'sensor'},
0x31:{name: 'SENSOR_MULTILEVEL',                      role: 'sensor', children: {
    Temperature: {role: 'value.temperature'}
}},
0x9c:{name: 'SENSOR_ALARM',                           role: 'alarm'},
0x71:{name: 'ALARM',                                  role: ''},
0x8F:{name: 'MULTI_CMD',                              role: ''},
0x46:{name: 'CLIMATE_CONTROL_SCHEDULE',               role: ''},
0x81:{name: 'CLOCK',                                  role: ''},
0x85:{name: 'ASSOCIATION',                            role: ''},
0x70:{name: 'CONFIGURATION',                          role: 'meta.config', children: {
    Level: {role: 'level.dimmer'}
}},
0x72:{name: 'MANUFACTURER_SPECIFIC',                  role: ''},
0x22:{name: 'APPLICATION_STATUS',                     role: ''},
0x9B:{name: 'ASSOCIATION_COMMAND_CONFIGURATION',      role: ''},
0x95:{name: 'AV_CONTENT_DIRECTORY_MD',                role: ''},
0x97:{name: 'AV_CONTENT_SEARCH_MD',                   role: ''},
0x96:{name: 'AV_RENDERER_STATUS',                     role: ''},
0x99:{name: 'AV_TAGGING_MD',                          role: ''},
0x50:{name: 'BASIC_WINDOW_COVERING',                  role: ''},
0x2A:{name: 'CHIMNEY_FAN',                            role: ''},
0x8D:{name: 'COMPOSITE',                              role: ''},
0x62:{name: 'DOOR_LOCK',                              role: ''},
0x90:{name: 'ENERGY_PRODUCTION',                      role: ''},
0x7a:{name: 'FIRMWARE_UPDATE_MD',                     role: ''},
0x8C:{name: 'GEOGRAPHIC_LOCATION',                    role: ''},
0x7B:{name: 'GROUPING_NAME',                          role: ''},
0x82:{name: 'HAIL',                                   role: ''},
0x87:{name: 'INDICATOR',                              role: ''},
0x9A:{name: 'IP_CONFIGURATION',                       role: 'meta.config'},
0x89:{name: 'LANGUAGE',                               role: ''},
0x76:{name: 'LOCK',                                   role: ''},
0x91:{name: 'MANUFACTURER_PROPRIETARY',               role: ''},
0x35:{name: 'METER_PULSE',                            role: ''},
0x32:{name: 'METER',                                  role: ''},
0x51:{name: 'MTP_WINDOW_COVERING',                    role: ''},
0x8E:{name: 'MULTI_INSTANCE_ASSOCIATION',             role: ''},
0x60:{name: 'MULTI_INSTANCE',                         role: ''},
0x00:{name: 'NO_OPERATION',                           role: ''},
0x77:{name: 'NODE_NAMING',                            role: ''},
0xf0:{name: 'NON_INTEROPERABLE',                      role: ''},
0x73:{name: 'POWERLEVEL',                             role: ''},
0x88:{name: 'PROPRIETARY',                            role: ''},
0x75:{name: 'PROTECTION',                             role: ''},
0x7c:{name: 'REMOTE_ASSOCIATION_ACTIVATE',            role: ''},
0x7d:{name: 'REMOTE_ASSOCIATION',                     role: ''},
0x2b:{name: 'SCENE_ACTIVATION',                       role: ''},
0x2C:{name: 'SCENE_ACTUATOR_CONF',                    role: ''},
0x2D:{name: 'SCENE_CONTROLLER_CONF',                  role: ''},
0x93:{name: 'SCREEN_ATTRIBUTES',                      role: ''},
0x92:{name: 'SCREEN_MD',                              role: ''},
0x98:{name: 'SECURITY',                               role: ''},
0x9E:{name: 'SENSOR_CONFIGURATION',                   role: ''},
0x9d:{name: 'SILENCE_ALARM',                          role: ''},
0x94:{name: 'SIMPLE_AV_CONTROL',                      role: ''},
0x25:{name: 'SWITCH_BINARY',                          role: 'switch'},
0x28:{name: 'SWITCH_TOGGLE_BINARY',                   role: ''},
0x29:{name: 'SWITCH_TOGGLE_MULTILEVEL',               role: ''},
0x44:{name: 'THERMOSTAT_FAN_MODE',                    role: ''},
0x45:{name: 'THERMOSTAT_FAN_STATE',                   role: ''},
0x38:{name: 'THERMOSTAT_HEATING',                     role: ''},
0x40:{name: 'THERMOSTAT_MODE',                        role: ''},
0x42:{name: 'THERMOSTAT_OPERATING_STATE',             role: ''},
0x47:{name: 'THERMOSTAT_SETBACK',                     role: ''},
0x43:{name: 'THERMOSTAT_SETPOINT',                    role: ''},
0x8B:{name: 'TIME_PARAMETERS',                        role: ''},
0x8a:{name: 'TIME',                                   role: ''},
0x63:{name: 'USER_CODE',                              role: ''},
0x34:{name: 'ZIP_ADV_CLIENT',                         role: ''},
0x33:{name: 'ZIP_ADV_SERVER',                         role: ''},
0x2F:{name: 'ZIP_ADV_SERVICES',                       role: ''},
0x2e:{name: 'ZIP_CLIENT',                             role: ''},
0x24:{name: 'ZIP_SERVER',                             role: ''},
0x23:{name: 'ZIP_SERVICES',                           role: ''}
};

function calcName(nodeid, comclass, idx, instance) {
    var name = adapter.namespace + ".NODE" + nodeid;
    if (comclass) {
        name += '.' + ((comclasses[comclass] ? comclasses[comclass].name : null) || ('CLASSES' + comclass));

        if (idx !== undefined) {
            //idx = idx.replace(/ /g, '_');
            idx = idx.replace(/\./g, '_');
            name = name + '.' + idx;

            if (instance != undefined) {
                name = name + "_" + instance;
            }
        }
    }

    var i = name.lastIndexOf(".");
    var len = name.length-1;
    if (i == len) {
        name = name.substring(0, len);
    }
    return name;
}

function main() {
    // Use new version of openzwave nodejs implementation
    //var OZW = require('./node_modules/openzwave/lib/openzwave.js');
    var OZW = require('./node_modules/openzwave-shared/lib/openzwave-shared.js');

    zwave = new OZW('/dev/' + adapter.config.usb, {
        logging:         adapter.config.logging,            // true                                     // enable logging to OZW_Log.txt
        consoleoutput:   adapter.config.consoleoutput,      // true                                     // copy logging to the console
        saveconfig:      adapter.config.saveconfig,         // true                                     // write an XML network layout
        driverattempts:  adapter.config.driverattempts,     // 3                                        // try this many times before giving up
        pollinterval:    adapter.config.pollintervall,      // 500                                      // interval between polls in milliseconds
        suppressrefresh: adapter.config.suppressrefresh,    // false                                    // do not send updates if nothing changed
        // TODO: Check if we really need this
        //modpath:         adapter.config.path              // __dirname + /../deps/open-zwave/config   // set's config path, should be
    });

    var nodes = [];

    zwave.on('connected', function(homeid) {
        adapter.states.setState('system.adapter.' + adapter.namespace + '.connected', {val: true, ack: true});
    });

    zwave.on('driver ready', function (homeid) {
        adapter.log.info('scanning homeid=0x'+homeid.toString(16)+'...');
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
        var rName = adapter.namespace + ".NODE" + nodeid + ".ready";
        adapter.setState(rName, {val: false, ack: true});
    });

    zwave.on('value added', function (nodeid, comclass, value) {
        adapter.log.debug("-----------> NODE: " + nodeid + "-----" + comclass + "-----" + JSON.stringify(value));
        var name = calcName(nodeid, comclass, value.label, value.genre=="user" ? value.instance : undefined);

        adapter.log.debug('##### Value added: ' + name + ' = ' + value.value + " index = " + value.index + " comclass = " + comclass + " instance = " + value.instance);

        nodes[nodeid].classes[comclass] = nodes[nodeid].classes[comclass] || {};
        nodes[nodeid].classes[comclass][value.index] = value;

        adapter.setState(name, {val: value.value, ack: true});
    });

    zwave.on('value changed', function (nodeid, comclass, value) {
        if (nodes[nodeid].ready) {
            var name = calcName(nodeid, comclass, value.label, value.genre=="user" ? value.instance : undefined);
            adapter.log.debug('Value changed: ' + name + ' from ' + nodes[nodeid].classes[comclass][value.index].value + ' to ' + value.value);
            adapter.setState(name, {val: value.value, ack: true});
        }
        nodes[nodeid].classes[comclass][value.index] = value;
    });

    zwave.on('value removed', function (nodeid, comclass, index) {
        var name = calcName(nodeid, comclass, nodes[nodeid].classes[comclass][index].label, nodes[nodeid].classes[comclass][index].genre=="user" ? nodes[nodeid].classes[comclass][index].instance : undefined);
        if (nodes[nodeid].classes[comclass] && nodes[nodeid].classes[comclass][index]) {
            adapter.delObject(name);
            delete nodes[nodeid].classes[comclass][index];
        }
        adapter.log.debug('Value removed: ' + name);

        if (zobjects[name]) delete zobjects[name];
    });

/**************************************************************/
    zwave.on('polling enabled', function(nodeid) {
        adapter.log.debug('node'+nodeid+': polling ENABLED, currently not implemented');
    });
    zwave.on('polling disabled', function(nodeid) {
        adapter.log.debug('node'+nodeid+': polling DISABLED, currently not implemented');
    });

    var notificationCodes = {
        0: 'message complete',
        1: 'timeout',
        2: 'nop',
        3: 'node awake',
        4: 'node sleep',
        5: 'node dead (Undead Undead Undead)',
        6: 'node alive',
    };
    zwave.on('notification', function(nodeid, notif) {
        adapter.log.debug('node'+nodeid+': '+notificationCodes[notif]+', currently not implemented');
    });

    var ctrlState = {
        0: 'No command in progress',
        1: 'The command is starting',
        2: 'The command was cancelled',
        3: 'Command invocation had error(s) and was aborted',
        4: 'Controller is waiting for a user action',
        5: 'Controller command is on a sleep queue wait for device',
        6: 'The controller is communicating with the other device to carry out the command',
        7: 'The command has completed successfully',
        8: 'The command has failed',
        9: 'The controller thinks the node is OK',
        10: 'The controller thinks the node has failed',
    };
    var ctrlError = {
        0: 'No error',
        1: 'ButtonNotFound',
        2: 'NodeNotFound',
        3: 'NotBridge',
        4: 'NotSUC',
        5: 'NotSecondary',
        6: 'NotPrimary',
        7: 'IsPrimary',
        8: 'NotFound',
        9: 'Busy',
        10: 'Failed',
        11: 'Disabled',
        12: 'Overflow',
    }
    zwave.on('controller command', function (state, error) {
        adapter.log.debug('controller command feedback: state:'+ctrlState[state]+' error:'+ctrlError[error]+', currently not implemented');
    });

    zwave.on('node naming', function (nodeid, nodeinfo) {
        adapter.log.debug('node naming nodeid:'+nodeid+' nodeinfo:'+JSON.stringify(nodeinfo)+', currently not implemented');
    });

    zwave.on('value refreshed', function(nodeid, commandclass, value) {
        adapter.log.debug('value refreshed nodeid:'+nodeid+' commandclass:'+commandclass+' value:'+value+', currently not implemented');
    });

    /**************************************************************/

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
        if (adapter.config.forceinit) {

            adapter.log.debug('node'+nodeid+': '+nodeinfo.manufacturer ? nodeinfo.manufacturer : 'id=' + nodeinfo.manufacturerid+', '+(nodeinfo.product ? nodeinfo.product :
                'product=' + nodeinfo.productid + ', type=' + nodeinfo.producttype));
            adapter.log.debug('node'+nodeid+': name="'+nodeinfo.name+'", type="'+nodeinfo.type+'", location="'+nodeinfo.loc+'"');

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
                    var instances = values[idx].instance;
                    for (var inst=1; inst<=instances; inst++) {
                        var name = calcName(nodeid, comclass, values[idx].label, values[idx].genre=="user" ? inst : undefined);
                        zobjects[name] = {
                            nodeid:   idx,
                            comclass: comclass,
                            idx:      idx,
                            label:    values[idx].label
                        };
                        DPs.push(name);
                        values[idx].comclass = comclass;
                        values[idx].nodeid   = nodeid;
                        values[idx].index    = idx;
                        values[idx].instance = inst;

                        var stateObj = {
                            common: {
                                name:  name, // You can add here some description
                                read:  true,
                                write: true
                            },
                            native: values[idx],
                            // parent: chName, // Do not use parent or children for
                            type:   'state'
                        };

                        if (comclasses[comclass] && comclasses[comclass].role) {
                            if (comclasses[comclass].children && comclasses[comclass].children[values[idx].label]) {
                                if (comclasses[comclass].children[values[idx].label].role) {
                                    stateObj.common.role = comclasses[comclass].children[values[idx].label].role;
                                } else {
                                    stateObj.common.role = comclasses[comclass].role;
                                }
                                if (comclasses[comclass].children[values[idx].label].type) {
                                    stateObj.common.type = comclasses[comclass].children[values[idx].label].type;
                                }
                            } else {
                                stateObj.common.role = comclasses[comclass].role;
                            }
                            //chObj.common.type = number, string, bool, array, object, mixed;
                        }
                        adapter.setObject(name, stateObj);
                    }
                }

                var chObj = {
                    common: {
                        name:  chName // You can add here some description
                    },
                    native: {
                        comclass: comclass,
                        nodeid:   nodeid
                    },
                    // children: DPs, // Do not use parent or children for
                    type: 'channel'
                };
                if (comclasses[comclass] && comclasses[comclass].role) {
                    chObj.common.role = comclasses[comclass].role;
                }

                adapter.setObject(chName, chObj);
            }

            nodes[nodeid].nodeid = nodeid;
            adapter.setObject(devName, {
                common: {
                    name:  devName, // You can add here some description
                    type:  '??',
                    role:  'state',
                    read:  true,
                    write: true
                },
                native:   nodes[nodeid],
                // children: channels,  // Do not use parent or children for
                type:     'device'
            });

            var rName = adapter.namespace + ".NODE" + nodeid + ".ready";
            adapter.setState(rName, {val: true, ack: true});
        }
    });

    zwave.on('notification', function (nodeid, notif) {
        switch (notif) {
            case 0:
                adapter.log.debug('node'+nodeid+': message complete');
                break;
            case 1:
                adapter.log.warn('node'+nodeid+': timeout');
                break;
            case 2:
                adapter.log.info('node'+nodeid+': nop');
                break;
            case 3:
                adapter.log.info('node'+nodeid+': node awake');
                break;
            case 4:
                adapter.log.info('node'+nodeid+': node sleep');
                break;
            case 5:
                adapter.log.warn('node'+nodeid+': node dead');
                break;
            case 6:
                adapter.log.info('node'+nodeid+': node alive');
                break;
        }
    });

    zwave.on('scan complete', function () {
        scanComplete = 1;

        if (adapter.config.forceinit) {
            adapter.extendForeignObject('system.adapter.' + adapter.namespace, {native: {forceinit: false}});
        }

        adapter.log.info('Scan completed');
    });

    zwave.connect();
}



