'use strict';

/**
 *      ioBroker Z-Wave Adapter
 *
 *      Copyright 2016, bluefox <dogafox@gmail.com>
 *
 *      License: GNU LGPL
 */

const path       = require("path");
const fs         = require("fs");

const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const comClasses = require(path.join(__dirname, 'admin/js/comClasses.js'));
var zwave;

var objects      = {};
var nodes        = {};
var inclusion    = null;
var exclusion    = null;
var addNodeSecure = false;

var notificationCodes = [
    /*0:*/ 'message complete',
    /*1:*/ 'timeout',
    /*2:*/ 'nop',
    /*3:*/ 'node awake',
    /*4:*/ 'node sleep',
    /*5:*/ 'node dead (Undead Undead Undead)',
    /*6:*/ 'node alive'
];

var ctrlState = [
    /*0: */ 'No command in progress',
    /*1: */ 'The command is starting',
    /*2: */ 'The command was cancelled',
    /*3: */ 'Command invocation had error(s) and was aborted',
    /*4: */ 'Controller is waiting for a user action (60s)',
    /*5: */ 'Controller command is on a sleep queue wait for device',
    /*6: */ 'The controller is communicating with the other device to carry out the command',
    /*7: */ 'The command has completed successfully',
    /*8: */ 'The command has failed',
    /*9: */ 'The controller thinks the node is OK',
    /*10:*/ 'The controller thinks the node has failed'
];

var ctrlError = [
    /*0:*/  'No error',
    /*1*/   'ButtonNotFound',
    /*2:*/  'NodeNotFound',
    /*3:*/  'NotBridge',
    /*4:*/  'NotSUC',
    /*5:*/  'NotSecondary',
    /*6:*/  'NotPrimary',
    /*7:*/  'IsPrimary',
    /*8:*/  'NotFound',
    /*9:*/  'Busy',
    /*10:*/ 'Failed',
    /*11:*/ 'Disabled',
    /*12:*/ 'Overflow'
];

/**
 * The adapter instance
 * @type {ioBroker.Adapter}
 */
let adapter;

/**
 * Starts the adapter instance
 * @param {Partial<ioBroker.AdapterOptions>} [options]
 */
function startAdapter(options) {
    // Create the adapter and define its methods
    return adapter = utils.adapter(Object.assign({}, options, {
        name: 'zwave',

        ready: function () {
            adapter.objects.getObjectList({
                startkey: adapter.namespace + '.',
                endkey:   adapter.namespace + '.\u9999',
                include_docs: true
            }, function (err, res) {
                adapter.objects.getObjectList({
                    startkey: 'enum.rooms.',
                    endkey:   'enum.rooms.\u9999',
                    include_docs: true
                }, function (err, rooms) {
                    objects = {};
                    var devices = [];
                    if (res) {
                        res = res.rows;
                        if (res) {
                            for (var i = 0; i < res.length; i++) {
                                objects[res[i].value._id] = res[i].value;
                                if (res[i].value.type === 'device') devices.push(res[i].value._id);
                            }
                        }
                    }

                    if (rooms) {
                        res = rooms.rows;
                        if (res) {
                            for (var r = 0; r < res.length; r++) {
                                objects[res[r].value._id] = res[r].value;
                            }
                        }
                    }

                    adapter.log.debug('received all objects');

                    adapter.subscribeObjects('*');
                    adapter.subscribeStates('*');
                    adapter.subscribeForeignObjects('enum.rooms.*');
                    extendInstanceObjects();
                    setAllNotReady(devices, main);
                });
            });
        },
        message: function (obj) {

            // responds to the adapter that sent the original message
            function respond(response) {
                if (obj.callback)
                    adapter.sendTo(obj.from, obj.command, response, obj.callback);
            }
            // some predefined responses so we only have to define them once
            var predefinedResponses = {
                ACK: { error: null },
                OK: { error: null, result: 'ok' },
                ERROR_UNKNOWN_COMMAND: { error: 'Unknown command!' },
                ERROR_NOT_RUNNING: { error: 'zwave driver is not running!' },
                MISSING_PARAMETER: function (paramName) {
                    return {error: 'missing parameter "' + paramName + '"!'};
                },
                COMMAND_RUNNING: {error: 'command running'}
            };
            // make required parameters easier
            function requireParams(params) {
                if (!(params && params.length)) return true;
                for (var i = 0; i < params.length; i++) {
                    if (!(obj.message && obj.message.hasOwnProperty(params[i]))) {
                        respond(predefinedResponses.MISSING_PARAMETER(params[i]));
                        return false;
                    }
                }
                return true;
            }

            // handle the message
            if (obj) {
                if (obj.command !== 'stopCommand' && obj.command !== 'listUart' && (inclusion || exclusion)) {
                    respond(predefinedResponses.COMMAND_RUNNING);
                    return;
                }
                addNodeSecure = false;
                switch (obj.command) {
                    case 'stopCommand':
                        disableInclusion();
                        disableExclusion();
                        respond(predefinedResponses.ACK);
                        break;

                    case 'listUart':
                        if (obj.callback) {
                            var ports = listSerial();
                            adapter.log.info('List of ports: ' + JSON.stringify(ports));
                            respond(ports);
                        }
                        break;

                    case 'softReset':
                    case 'hardReset': // destructive! will wipe out all known configuration
                    case 'healNetwork':
                        if (zwave) {
                            adapter.log.info('Execute ' + obj.command);
                            if (zwave[obj.command]) {
                                zwave[obj.command]();
                                respond(predefinedResponses.OK);
                                
                                if (obj.command === "hardReset") {
                                    // hardReset deletes all node info on the controller
                                    // make sure the nodes get deleted in ioBroker aswell
                                    deleteAllNonControllerNodes();
                                }
                            } else {
                                adapter.log.error('Unknown command!');
                                respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                            }
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;
                    case 'networkmap':
                        if (zwave) {
                            adapter.log.debug('Show network map');
                            var map = [];
                            var allNodeIDs = Object.keys(nodes);
                            var edges = {};
                            for (var i in allNodeIDs) {
                                const nodeID = allNodeIDs[i];
                                edges[nodeID] = [];
                                var neighbors = zwave.getNodeNeighbors(nodeID);
                                for (var n in neighbors) {
                                    if (!edges[neighbors[n]]) {
                                        edges[nodeID].push(neighbors[n]);
                                    }
                                }
                                var channelID = calcName(nodeID);                                
                                var item = {
                                    "nodeID": nodeID,
                                    "neighbors": edges[nodeID],
                                    "label": objects[channelID].common.name
                                }
                                map.push(item);                          
                            }
                            adapter.getState('info.networkLayout', function (err, result) {
                                if (!err && result.val) {                                    
                                    const layout = JSON.parse(result.val);
                                    for (var e in map) {
                                        var item = map[e];
                                        if (layout[item.nodeID]) {
                                            item['x'] = layout[item.nodeID].x;
                                            item['y'] = layout[item.nodeID].y;
                                        }
                                    }
                                    respond(map);
                                } else {
                                    respond(map);
                                }
                            });                                                        
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }                        
                        break;
                        
                    case 'storeNetworkLayout':
                        if (obj.message) {
                            adapter.log.debug("saving layout");
                            adapter.setState('info.networkLayout', JSON.stringify(obj.message), true);
                            respond(predefinedResponses.OK);
                        } else {
                            respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                        }
                        break;

                    case 'removeFailedNode':
                    case 'requestNodeNeighborUpdate':
                    case 'assignReturnRoute':
                    case 'deleteAllReturnRoutes':
                    case 'replaceFailedNode':
                    case 'requestNetworkUpdate':
                    case 'replicationSend':
                    case 'refreshNodeInfo':
                    case 'healNetworkNode':
                        if (zwave && obj.message) {
                            adapter.log.info('Execute ' + obj.command + ' for ' + obj.message.nodeID);
                            if (zwave[obj.command]) {
                                zwave[obj.command](obj.message.nodeID);
                                respond(predefinedResponses.OK);
                            } else {
                                adapter.log.error('Unknown command!');
                                respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                            }
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    case 'setNodeName':
                    case 'setNodeLocation':
                        if (zwave && obj.message) {
                            adapter.log.info('Execute ' + obj.command + ' for ' + obj.message.nodeID + ' with "' + obj.message.param + '"');
                            if (zwave[obj.command]) {
                                zwave[obj.command](obj.message.nodeID, obj.message.param);
                                respond(predefinedResponses.OK);
                            } else {
                                adapter.log.error('Unknown command!');
                                respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                            }
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    // createButton(nodeid, buttonid)
                    // deleteButton(nodeid, buttonid)
                    case 'createButton':
                    case 'deleteButton':
                        if (zwave && obj.message) {
                            adapter.log.info('Execute ' + obj.command + ' for ' + obj.message.nodeID + ' with "' + obj.message.param + '"');
                            if (zwave[obj.command]) {
                                zwave[obj.command](obj.message.nodeID, obj.message.param);
                                respond(predefinedResponses.OK);
                            } else {
                                adapter.log.error('Unknown command!');
                                respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                            }
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;


                    case 'addNodeSecure':
                        addNodeSecure = true;
                    case 'addNode':
                        if (zwave) {
                            adapter.log.info('Execute addNode ' + (addNodeSecure ? 'secure' : ''));
                            adapter.setState('inclusionOn', true, true);
                            inclusion = setTimeout(function () {
                                disableInclusion();
                            }, 60000);
                            zwave.addNode(addNodeSecure);
                            respond(predefinedResponses.ACK);
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    case 'removeNode':
                        if (zwave) {
                            adapter.log.info('Execute ' + obj.command);
                            adapter.setState('exclusionOn', true, true);
                            exclusion = setTimeout(function () {
                                disableExclusion();
                            }, 60000);
                            zwave.removeNode();
                            respond(predefinedResponses.ACK);
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    // Association groups management functions:
                    case 'getNumGroups': // zwave.getNumGroups(nodeid) => number;
                        if (zwave && obj.message) {
                            if (!requireParams(["nodeID"])) break;
                            adapter.log.info('Requesting number of association groups from node' + obj.message.nodeID);
                            if (zwave[obj.command]) {
                                let result = zwave[obj.command](obj.message.nodeID);
                                respond({ error: null, result: result });
                            } else {
                                adapter.log.error('Unknown command!');
                                respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                            }
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    case 'getGroupLabel': // zwave.getGroupLabel(nodeid, group) => string;
                        if (zwave && obj.message) {
                            if (!requireParams(["nodeID", "group"])) break;
                            adapter.log.info('Requesting label of association group ' + obj.message.group + ' from node ' + obj.message.nodeID);
                            if (zwave[obj.command]) {
                                let result = zwave[obj.command](obj.message.nodeID, obj.message.group);
                                respond({ error: null, result: result });
                            } else {
                                adapter.log.error('Unknown command!');
                                respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                            }
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    case 'getAllAssociationGroups': // shortcut to get all groups => { groupIndex: {label: <string>, maxAssociations: <number>, isLifeline: <boolean>}, ...}
                        if (zwave && obj.message) {
                            if (!requireParams(["nodeID"])) break;
                            adapter.log.info('Requesting all association groups from node ' + obj.message.nodeID);
                            /** @type {Record<string, any> | string} */
                            let result = {};
                            // get the number of groups
                            var numGroups = zwave.getNumGroups(obj.message.nodeID);
                            if (numGroups > 0) {
                                // and for each group request the label and association count
                                for (var group = 1; group <= numGroups; group++) {
                                    result[group] = {
                                        label: zwave.getGroupLabel(obj.message.nodeID, group),
                                        maxAssociations: zwave.getMaxAssociations(obj.message.nodeID, group),
                                        isLifeline: false
                                    };
                                }
                                // now find out which group is the lifeline
                                var foundLifeline = false;
                                for (var strategy = 1; strategy <= 3; strategy++) {
                                    switch (strategy) {
                                        case 1: // strategy 1: find the group with maxAssoc 1 and label "Lifeline"
                                            for (var group = 1; group <= numGroups; group++) {
                                                if (result[group].label === "Lifeline" && result[group].maxAssociations === 1) {
                                                    result[group].isLifeline = true;
                                                    foundLifeline = true;
                                                    break;
                                                }
                                            }
                                            break;

                                        case 2: // strategy 2: find a group with maxAssoc 1
                                            for (var group = 1; group <= numGroups; group++) {
                                                if (result[group].maxAssociations === 1) {
                                                    result[group].isLifeline = true;
                                                    foundLifeline = true;
                                                    break;
                                                }
                                            }
                                            break;

                                        case 3: // strategy 3: use group #1 as lifeline
                                            result[1].isLifeline = true;
                                            foundLifeline = true;
                                            break;
                                    }
                                    if (foundLifeline) break;
                                }
                            } else {
                                result = "no groups";
                            }
                            respond({ error: null, result: result });
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    case 'getAssociations': // zwave.getAssociations(nodeid, group);
                        if (zwave && obj.message) {
                            if (!requireParams(["nodeID", "group"])) break;
                            adapter.log.info('Requesting associations in group ' + obj.message.group + ' from node ' + obj.message.nodeID);
                            if (zwave.isMultiInstance(obj.message.nodeID, obj.message.group)) {
                                let result = zwave.getAssociationsInstances(obj.message.nodeID, obj.message.group);
                                var response = [];
                                if (result.length > 0) {
                                    for (var i = 0; i < result.length; ++i) {
                                        if (result[i].instance > 0) {
                                            // <node id>.<instance id>
                                            response.push(result[i].nodeid+"."+result[i].instance);
                                        } else {
                                            response.push(result[i].nodeid);
                                        }
                                    }
                                }
                                respond({ error: null, result: response });
                            } else {
                                let result = zwave.getAssociations(obj.message.nodeID, obj.message.group);
                                respond({ error: null, result: result });
                            }
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    case 'getMaxAssociations': // zwave.getMaxAssociations(nodeid, group);
                        if (zwave && obj.message) {
                            if (!requireParams(["nodeID", "group"])) break;
                            adapter.log.info('Requesting max number of associations in group ' + obj.message.group + ' from node ' + obj.message.nodeID);
                            if (zwave[obj.command]) {
                                let result = zwave[obj.command](obj.message.nodeID, obj.message.group);
                                respond({ error: null, result: result });
                            } else {
                                adapter.log.error('Unknown command!');
                                respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                            }
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    case 'addAssociation': // zwave.addAssociation(nodeid, group, target_nodeid);
                        if (zwave && obj.message) {
                            if (!requireParams(["nodeID", "group", "target_nodeid"])) break;                            
                            if (zwave[obj.command]) {
                                if (typeof obj.message.target_nodeid === 'string' && obj.message.target_nodeid.indexOf('.') != -1) {
                                    var parts = obj.message.target_nodeid.split('.');
                                    adapter.log.info('Adding association with node ' + parts[0] + ' and instance ' + parts[1] + ' to group ' + obj.message.group + ' of node ' + obj.message.nodeID);
                                    zwave.addAssociation(obj.message.nodeID, obj.message.group, parts[0], parts[1]);
                                } else {
                                    adapter.log.info('Adding association with node ' + obj.message.target_nodeid + ' to group ' + obj.message.group + ' of node ' + obj.message.nodeID);
                                    zwave.addAssociation(obj.message.nodeID, obj.message.group, obj.message.target_nodeid);
                                }
                                respond(predefinedResponses.OK);
                            } else {
                                adapter.log.error('Unknown command!');
                                respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                            }
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    case 'removeAssociation': // zwave.removeAssociation(nodeid, group, target_nodeid);
                        if (zwave && obj.message) {
                            if (!requireParams(["nodeID", "group", "target_nodeid"])) break;
                            if (zwave[obj.command]) {
                                if (typeof obj.message.target_nodeid === 'string' && obj.message.target_nodeid.indexOf('.') != -1) {
                                    var parts = obj.message.target_nodeid.split('.');
                                    adapter.log.info('Removing association with node ' + parts[0] + ' and instance ' + parts[1] + ' from group ' + obj.message.group + ' of node ' + obj.message.nodeID);
                                    zwave.removeAssociation(obj.message.nodeID, obj.message.group, parts[0], parts[1]);
                                } else {
                                    adapter.log.info('Removing association with node ' + obj.message.target_nodeid + ' from group ' + obj.message.group + ' of node ' + obj.message.nodeID);
                                    zwave.removeAssociation(obj.message.nodeID, obj.message.group, obj.message.target_nodeid);
                                }
                            } else {
                                adapter.log.error('Unknown command!');
                                respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                            }
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;
                        
                    case 'getNumberOfInstances': // get the number of instances that are supported by the node
                        if (zwave && obj.message) {
                            if (!requireParams(["nodeID"])) break;
                            var instances = 1;
                            const id = calcName(obj.message.nodeID);
                            for (var i in objects) {
                                if (!objects.hasOwnProperty(i)) continue;
                                if (i.startsWith(id + '.')) {                                    
                                    if (objects[i].native && objects[i].native.value_id && objects[i].native.instance > instances) {
                                        instances = objects[i].native.instance;
                                    }
                                }
                            }
                            adapter.log.debug("getNumberOfInstances for "+obj.message.nodeID + "=" + instances);
                            respond(instances);
                        } else {
                            respond(predefinedResponses.ERROR_NOT_RUNNING);
                        }
                        break;

                    case 'getControllerState': // used by the message view of the admin
                        adapter.getState('info.controllerMessage', function (err, result) {
                            if (!err) {
                                const data = JSON.parse(result.val);
                                var response = {
                                    "state": ctrlState[data.state],
                                    "error": ((data.error && data.error !== 0) || data.state == 8) ? true : false,
                                    "helpMsg": data.helpMsg + " (" + ctrlError[data.error] + ")"
                                }
                                respond(response);
                            }
                        });
                        break;

                    default:
                        adapter.log.error('Unknown command: ' + obj.command);
                        break;
                }
            }
        },

        objectChange: function (id, obj) {
            if (!obj) {
                if (objects[id]) delete objects[id];
            } else {
                objects[id] = obj;
            }
        },

        stateChange: function (id, state) {
            if (!state || state.ack || state.val === undefined) return;

            adapter.log.debug('stateChange ' + id + ' set ' + JSON.stringify(state));

            var obj = objects[id];
            if (obj && obj.native) {
                var nodeID = obj.native.node_id;
                var valueID = { // this allows to shorten the zwave API calls
                    node_id: obj.native.node_id,
                    class_id: obj.native.class_id,
                    instance: obj.native.instance,
                    index: obj.native.index
                };
                if (nodes[nodeID]) {
                    var value = state.val;
                    if (state.val === true || state.val === 'true') {
                        value = 1;
                        if (obj.native.max !== undefined && obj.native.max !== obj.native.min) value = obj.native.max;
                    } else if (state.val === false || state.val === 'false') {
                        value = 0;
                        if (obj.native.min !== undefined && obj.native.max !== obj.native.min) value = obj.native.min;
                    }
                    if (obj.native.type === 'bool' || obj.native.type === 'button') value = !!value;

                    if (obj.common.role === 'meta.config') {
                        // set a configuration parameter
                        adapter.log.debug('setConfigParam for: nodeID=' + obj.native.node_id + ': index=' + obj.native.index + ': value=' + value);
                        if (zwave) {
                            zwave.setConfigParam(
                                obj.native.node_id,
                                obj.native.index,
                                value,
                                value.length
                            );
                        }
                    } else if (obj.native.type === 'button') {
                        // openzwave-shared only presses buttons and doesn't release them on setValue
                        // so we need to press/release them ourselves
                        adapter.log.debug((value ? 'pushing' : 'releasing') + ' button for: nodeID=' + obj.native.node_id + ': comClass=' + obj.native.class_id + ': index=' + obj.native.index + ': instance=' + obj.native.instance);
                        if (zwave) {
                            if (value) {
                                zwave.pressButton(valueID);
                            } else {
                                zwave.releaseButton(valueID);
                            }
                        }
                    } else {
                        // set a value
                        adapter.log.debug('setState for: nodeID=' + obj.native.node_id + ': comClass=' + obj.native.class_id + ': index=' + obj.native.index + ': instance=' + obj.native.instance + ': value=' + value);
                        if (zwave) zwave.setValue(valueID, value);
                    }
                } else {
                    if (!nodes[nodeID]) {
                        adapter.log.warn('Object "' + id + '" was not detected');
                    } else {
                        adapter.log.warn('Object "' + id + '" is not ready');
                    }
                }
            } else {
                adapter.log.warn('Object "' + id + '" not found for stateChange');
            }
        },

        unload: function (callback) {
            if (zwave) zwave.disconnect(adapter.config.usb);

            resetInstanceStatusInfo();

            callback();
        }
    }));
}

function filterSerialPorts(path) {
    // get only serial port names
    if (!(/(tty(S|ACM|USB|AMA|MFD)|rfcomm)/).test(path)) return false;

    return fs
        .statSync(path)
        .isCharacterDevice();
}

function listSerial() {
    // Filter out the devices that aren't serial ports
    var devDirName = '/dev';

    let result;
    try {
        result = fs
            .readdirSync(devDirName)
            .map(function (file) {
                return path.join(devDirName, file);
            })
            .filter(filterSerialPorts)
            .map(function (port) {
                return {comName: port};
            });
    } catch (e) {
        adapter.log.error('Cannot read "' + devDirName + '": ' + e);
        result = [];
    }
    return result;
}

function extendInclusion() {
    if (inclusion) {
        clearTimeout(inclusion);
        inclusion = setTimeout(function () {
            disableInclusion();
        }, 30000);
    }
}

function disableInclusion() {
    adapter.log.info('disabled inclusion mode');
    adapter.setState('inclusionOn', false, true);
    if (inclusion) {
        clearTimeout(inclusion);
        inclusion = null;
        if (zwave) zwave.cancelControllerCommand();
        return true;
    }
    return false;
}

function disableExclusion() {
    adapter.log.info('disabled exclusion mode');
    adapter.setState('exclusionOn', false, true);
    if (exclusion) {
        clearTimeout(exclusion);
        exclusion = null;
        if (zwave) zwave.cancelControllerCommand();
        return true;
    }
    return false;
}

function setAllNotReady(list, callback) {
    if (!list || !list.length) {
        callback();
    } else {
        var id = list.pop();
        adapter.setForeignState(id + '.ready', false, true, function () {
            adapter.setForeignState(id + '.sleep', false, true, function () {
                adapter.setForeignState(id + '.alive', false, true, function () {
                    setTimeout(setAllNotReady, 0, list, callback);
                });
            });
        });
    }
}

function delObjects(list, callback) {
    if (!list || !list.length) {
        if (callback) callback();
    } else {
        var obj  = list.pop();
        var id   = obj.id || obj._id;
        var type = obj.value ? obj.value.type : obj.type;

        adapter.delForeignObject(id, function (err) {
            if (err && err !== 'Not exists') adapter.log.error('res from delObject: ' + err);

            if (type === 'state') {
                adapter.delForeignState(id, function (err) {
                    if (err && err !== 'Not exists') adapter.log.error('res from deleteState: ' + err);
                    setTimeout(delObjects, 0, list, callback);
                });
            } else {
                setTimeout(delObjects, 0, list, callback);
            }
        });
    }
}

// This fixes existing zwave state objects, so they are using role="switch" instead of role="button"
// because Zwave buttons support two states. Call 
function fixZwaveButtons(callback) {
    adapter.log.debug('fixing zwave buttons to use common.role "switch" instead of "button"');
    // Find all state objects representing a zwave button
    var stateObjs = Object.keys(objects)
        .filter(function (id) { return id.startsWith(adapter.namespace); })
        .map(function (id) { return objects[id] })
        .filter(function (obj) { return obj.type === "state" && obj.common.role === "button" && obj.native.type === "button"; })
        ;
    if (!(stateObjs && stateObjs.length > 0)) {
        // no objects to fix, return immediately
        if (callback) callback();
        return;
    } else {
        adapter.log.debug('found ' + stateObjs.length + ' states to fix');
        doFix(stateObjs);
    }

    function doFix(list) {
        if (!list.length) {
            adapter.log.debug('done fixing states');
            if (callback) callback();
            return;
        }

        var obj = list.pop();
        var id = obj.id || obj._id;
        obj.common.role = "switch";
        adapter.setObject(id, obj, function (err) {
            setTimeout(doFix, 0, list);
        });
    }
}

/**
 * Replaces forbidden chars in strings used for IDs
 * @param {string} id The ID which might contain forbidden
 * @param {boolean} [includeDots=false] Whether "." should be escaped aswell
 * @returns {string}
 */
function replaceForbiddenCharsInID(id, includeDots) {
    // Although JS-Controller offers a FORBIDDEN_CHARS regex on the adapter class,
    // we use our own here, because we need to escape spaces aswell
    const regex = /[\]\[*,;'"`<>\\?\s]+/g;
    id = id.replace(regex, '_');
    if (includeDots) id = id.replace(/\./g, '');
    return id;
}

function calcName(nodeID, comClass, idx, instance) {
    var name = adapter.namespace + '.NODE' + nodeID;
    if (comClass) {
        name += '.' + ((comClasses[comClass] ? comClasses[comClass].name : '') || ('CLASSES' + comClass));

        if (idx !== undefined) {
            idx = replaceForbiddenCharsInID(idx, true);
            name = name + '.' + idx;

            if (instance !== undefined) {
                name = name + '_' + instance;
            }
        }
    }

    var i = name.lastIndexOf('.');
    var len = name.length - 1;
    if (i === len) name = name.substring(0, len);
    return name;
}

function extendNode(nodeID, nodeInfo, callback) {
    var id = calcName(nodeID);
    nodeInfo = JSON.parse(JSON.stringify(nodeInfo));
    nodeInfo.nodeID = nodeID;

    var count = 0;
    if (objects[id]) {
        if (JSON.stringify(objects[id].native) !== JSON.stringify(nodeInfo)) {
            adapter.log.info('Update ' + id);
            objects[id].native = nodeInfo;
            if (!objects[id].common.name || nodeInfo.name) objects[id].common.name = nodeInfo.name || nodeInfo.manufacturer ? nodeInfo.name || (nodeInfo.manufacturer + ' ' + nodeInfo.product) : '';
            count++;
            adapter.extendForeignObject(id, objects[id], function () {
                if (!--count && callback) callback();
            });
        }
    } else {
        /** @type {ioBroker.SettableObject} */
        var devObj = {
            common: {
                name: nodeInfo.name || nodeInfo.manufacturer ? nodeInfo.name || (nodeInfo.manufacturer + ' ' + nodeInfo.product) : '',
                role: 'state'
            },
            native: nodeInfo,
            type: 'device'
        };
        adapter.log.info('Create new device: ' + id + '[' + devObj.common.name + ']');
        count++;
        adapter.setForeignObject(id, devObj, function () {
            if (!--count && callback) callback();
        });
    }

    // create ready flag
    if (!objects[id + '.ready']) {
        count++;
        adapter.setForeignObject(id + '.ready', {
            common: {
                name:  'If ' + nodeInfo.product + ' is ready for commands',
                write: false,
                read:  true,
                type:  'boolean',
                role:  'indicator.ready'
            },
            native: {},
            type: 'state'
        }, function () {
            if (!--count && callback) callback();
        });
    }
    if (!objects[id + '.alive']) {
        count++;
        adapter.setForeignObject(id + '.alive', {
            common: {
                name:  'If ' + nodeInfo.product + ' is alive',
                write: false,
                read:  true,
                type:  'boolean',
                role:  'indicator.alive'
            },
            native: {},
            type: 'state'
        }, function () {
            if (!--count && callback) callback();
        });
    }
    if (!objects[id + '.sleep']) {
        count++;
        adapter.setForeignObject(id + '.sleep', {
            common: {
                name:  'If ' + nodeInfo.product + ' is sleeping',
                write: false,
                read:  true,
                type:  'boolean',
                role:  'indicator.sleep'
            },
            native: {},
            type: 'state'
        }, function () {
            if (!--count && callback) callback();
        });
    }

    //create event state
    if (!objects[id + '.event']) {
        count++;
        adapter.setForeignObject(id + '.event', {
            common: {
                name:  'Received events from node',
                write: false,
                read:  true,
                type:  'mixed',
                role:  'state'
            },
            native: {},
            type: 'state'
        }, function () {
            if (!--count && callback) callback();
        });
    }

    if (nodeInfo.loc) {
        var roomId = 'enum.rooms.' + replaceForbiddenCharsInID(nodeInfo.loc, false);
        if (!objects[roomId]) {
            count++;
            objects[roomId] = {
                type: 'enum',
                common: {
                    name:    nodeInfo.loc,
                    desc:    '',
                    members: [roomId]
                }
            };
            adapter.setForeignObject(roomId, objects[roomId], function () {
                if (!--count && callback) callback();
            });
        } else if (objects[roomId].common.members && objects[roomId].common.members.indexOf(id) === -1) {
            objects[roomId].common.members.push(id);
            count++;
            adapter.setForeignObject(roomId, objects[roomId], function () {
                if (!--count && callback) callback();
            });
        }
    }

    if (!count && callback) callback();
}

function extendChannel(nodeID, comClass, valueId) {
    if (!valueId || !comClass) return;

    var channelID = calcName(nodeID, comClass);
    var stateID   = calcName(nodeID, comClass, valueId.label, valueId.genre === 'user' ? valueId.instance : undefined);

    // Create channel
    if (objects[channelID]) {
        var newNative = objects[channelID].native || {};
        newNative.nodeID = nodeID;

        // compare native
        if (JSON.stringify(objects[channelID].native) !== JSON.stringify(newNative) ||
                // compare role
            (comClasses[comClass] && comClasses[comClass].role && !objects[channelID].common.role)) {
            if (comClasses[comClass] && comClasses[comClass].role) {
                objects[channelID].common.role = comClasses[comClass].role;
            }
            objects[channelID].native = newNative;
            adapter.log.info('Channel updated: ' + channelID + ' = ' + valueId.value + ', index = ' + valueId.index + ', comClass = ' + comClass + ', instance = ' + valueId.instance);
            adapter.extendForeignObject(channelID, objects[channelID]);
        }
    } else {
        /** @type {ioBroker.SettableObject} */
        var chObj = {
            common: {
                name: valueId.label
            },
            native: {
                nodeID:   nodeID
            },
            type: 'channel',
            _id: channelID
        };
        if (comClasses[comClass] && comClasses[comClass].role) {
            chObj.common.role = comClasses[comClass].role;
        }
        adapter.log.info('Channel created: ' + channelID + ' = ' + valueId.value + ', index = ' + valueId.index + ', comClass = ' + comClass + ', instance = ' + valueId.instance);
        adapter.setForeignObject(channelID, chObj);
    }

    var role;
    var type;
    if (comClasses[comClass] && comClasses[comClass].role) {
        if (comClasses[comClass].children && comClasses[comClass].children[valueId.label]) {
            var child = comClasses[comClass].children[valueId.label];
            if (child.role) {
                role = child.role;
            } else {
                role = comClasses[comClass].role;
            }

            if (child.type) {
                type = child.type;
            } else if (comClasses[comClass].type) {
                type = comClasses[comClass].type;
            }
        } else {
            role = comClasses[comClass].role;
            type = comClasses[comClass].type;
        }
    }

    valueId = JSON.parse(JSON.stringify(valueId));
    var value = valueId.value;
    if (valueId.value !== undefined) delete valueId.value;

    var stateObj;
    // Create state
    if (objects[stateID]) {
        stateObj = objects[stateID];
        if (stateObj.common.type === 'boolean') {
            value = value === true || value === 'true' || value === 255 || value === '255' || value === 'On' || value === 1  || value === '1';
        } else if (valueId.type === "decimal") {
            // OZW reports strings, so parse them
            value = !isNaN(parseFloat(value)) ? parseFloat(value) : value;
        } else if (stateObj.common.states) {
            for (var j in stateObj.common.states) {
                if (!stateObj.common.states.hasOwnProperty(j)) continue;
                if (stateObj.common.states[j] === value) {
                    value = j;
                    break;
                }
            }
        }

        // compare native
        if (JSON.stringify(stateObj.native) !== JSON.stringify(valueId) ||
            // compare role
            (role && !stateObj.common.role)) {
            if (role && !stateObj.common.role) stateObj.common.role = role;

            stateObj.native = valueId;
            adapter.log.debug('State updated: ' + stateID + ' = ' + value + ', index = ' + valueId.index + ', comClass = ' + comClass + ', instance = ' + valueId.instance);
            adapter.extendForeignObject(stateID, stateObj);
        }
        if (value !== undefined) adapter.setForeignState(stateID, value, true);
    } else {
        /** @type {ioBroker.StateObject} */
        stateObj = ({
            common: {
                name:  valueId.label,
                type:  type || 'number',
                role:  role || 'state',
                read:  !valueId.write_only,
                write: !valueId.read_only
            },
            native: valueId,
            type:   'state',
            _id:    stateID
        });
        if (valueId.units) stateObj.common.unit = valueId.units;

        if (valueId.type === 'byte' || valueId.type === 'int' || valueId.type === 'decimal' || valueId.type === 'short') stateObj.common.type = 'number';
        if (valueId.type === 'bool') stateObj.common.type = 'boolean';
        if (valueId.type === 'string') stateObj.common.type = 'string';

        if (valueId.type === 'button') {
            stateObj.common.type = 'boolean';
            // TODO: in the long run, this should be a special role which supports 3 states:
            // neutral, pressed => sends true, released => sends false
            stateObj.common.role  = 'switch';
            stateObj.common.write = true;
            stateObj.common.read  = false;
        }

        if (stateObj.common.type === 'number') {
            if (!valueId.values && valueId.min !== valueId.max) {
                if (valueId.min !== undefined) stateObj.common.min  = valueId.min;
                if (valueId.max !== undefined) stateObj.common.max  = valueId.max;
            }
            if (valueId.values) {
                // "min":0,"max":0,   "values":["Disabled","Off Enabled","On Enabled","On and Off Enabled"] => "On and Off Enabled"
                // "min":0,"max":0,   "values":["Normal","-1dB","-2dB","-3dB","-4dB","-5dB","-6dB","-7dB","-8dB","-9dB"] => "Normal"
                // "min":0,"max":0,   "values":["Unprotected","Protection by Sequence","No Operation Possible"] => "Unprotected"
                // "min":0,"max":255, "values":["On","Off"] => "Off"
                if (valueId.values.length === 2 &&
                    (valueId.values[0] === 'On' || valueId.values[0] === 'Off') &&
                    (valueId.values[1] === 'On' || valueId.values[1] === 'Off')) {
                    stateObj.common.type = 'boolean';
                    value = (value === 'On');
                } else {
                    stateObj.common.states = {};
                    for (var i = 0; i < valueId.values.length; i++) {
                        stateObj.common.states[i] = valueId.values[i];
                        if (valueId.values[i] === value) value = i;
                    }
                }
            } else if (valueId.type === "decimal") {
                // OZW reports strings, so parse them
                value = !isNaN(parseFloat(value)) ? parseFloat(value) : value;
            }
        }

        if (!stateObj.common.write && (stateObj.common.role === 'switch' || stateObj.common.role === 'state')) {
            if (stateObj.common.type === 'number')  stateObj.common.role = 'value';
            if (stateObj.common.type === 'boolean') stateObj.common.role = 'indicator';
        }

        adapter.log.info('State created: ' + stateID + ' = ' + valueId.value + ', index = ' + valueId.index + ', comClass = ' + comClass + ', instance = ' + valueId.instance);
        adapter.setForeignObject(stateID, stateObj, function () {
            if (value !== undefined) adapter.setForeignState(stateID, value, true);
        });
    }
}

function getAllSubObjects(nodeID, list) {
    var id = calcName(nodeID);
    list = list || [];

    for (var i in objects) {
        if (!objects.hasOwnProperty(i)) continue;
        if (i.substring(0, id.length + 1) === id + '.' || i === id) {
            list.push(objects[i]);
        }
    }

    return list;
}

function deleteDevice(nodeID, callback) {
    delObjects(getAllSubObjects(nodeID), function() {
        // delete the node before calling the callback
        // so deleteAllNonControllerNodes works
        if (nodes[nodeID]) delete nodes[nodeID];
        if (typeof callback === "function") callback();
    });
}

function deleteAllNonControllerNodes() {
    // find the last node which is not the controller (ID 1)
    var allNodeIDs = Object.keys(nodes);
    if (allNodeIDs.length <= 1) return;
    var lastNodeID = parseInt(allNodeIDs[allNodeIDs.length - 1]);
    // delete it
    if (lastNodeID > 1) {
        deleteDevice(lastNodeID, function() {
            // and continue with the next one
            setTimeout(deleteAllNonControllerNodes, 0);
        });
    }
}

function resetInstanceStatusInfo() {
    // resets states with information about adapter status
    adapter.setState('info.connection', false, true);
    adapter.setState('info.driverReady', false, true);
    adapter.setState('info.scanCompleted', false, true);
    adapter.setState('info.libraryVersion', '', true);
    adapter.setState('info.libraryTypeName', '', true);
    adapter.setState('inclusionOn', false, true);
    adapter.setState('exclusionOn', false, true);
    adapter.setState('info.controllerMessage', '', true);
    adapter.setObjectNotExists('info.networkLayout', {
        type: 'state',        
        common: {
            name: 'Network layout',
            type: 'string',
            role: 'state',
            read: true,
            write: false
        },
        native: {}
    });
}

function main() {
    resetInstanceStatusInfo();

    if (!adapter.config.usb) {
        adapter.log.warn('No USB selected');
        return;
    }

    var OZW = require('openzwave-shared');

    zwave = new OZW({
        Logging:              adapter.config.logging,            // true  - enable logging to OZW_Log.txt
        ConsoleOutput:        adapter.config.consoleoutput,      // true  - copy logging to the console
        SaveConfiguration:    adapter.config.saveconfig,         // true  - write an XML network layout
        DriverMaxAttempts:    adapter.config.driverattempts,     // 3     - try this many times before giving up
        PollInterval:         adapter.config.pollinterval,       // 500   - interval between polls in milliseconds
        SuppressValueRefresh: adapter.config.suppressrefresh,    // false - do not send updates if nothing changed
        NetworkKey:           adapter.config.networkkey,          // 0102..- use for secure connections
        AssumeAwake:          false         // faster start as sleeping devices are not queries on startup
    });

    // ------------- controller events ---------------------------
    zwave.on('connected', function (ozw) {
        adapter.setState('info.OZW', ozw, true);
        adapter.log.info('device connected: OZW = ' + ozw);
    });

    zwave.on('driver ready', function (homeid) {
        adapter.log.info('scanning homeid=0x' + homeid.toString(16) + '...');
        adapter.setState('info.homeId', homeid.toString(16), true);
        adapter.log.info('driver ready: homeid = ' + homeid.toString(16));
        adapter.setState('info.driverReady', true, true);
    });

    zwave.on('driver failed', function () {
        adapter.setState('info.connection', false, true);
        adapter.setState('info.driverReady', false, true);
        adapter.log.error('failed to start driver');
        zwave.disconnect(adapter.config.usb);
        typeof adapter.terminate === 'function' ? adapter.terminate('failed to start driver') : process.exit();
    });

    zwave.on('scan complete', function () {
        adapter.setState('forceInit', false, true);
        adapter.log.info('Scan completed');
        adapter.setState('info.scanCompleted', true, true);
        // set status to green only after the scan is completed
        adapter.setState('info.connection', true, true);
        
        adapter.setState('info.libraryVersion', zwave.getLibraryVersion(), true);
        adapter.setState('info.libraryTypeName', zwave.getLibraryTypeName(), true);
        adapter.setState('info.controllerNodeId', zwave.getControllerNodeId(), true);
        adapter.setState('info.SUCNodeId', zwave.getSUCNodeId(), true);
        adapter.setState('info.primaryController', zwave.isPrimaryController(), true);
        adapter.setState('info.staticUpdateController', zwave.isStaticUpdateController(), true);
        adapter.setState('info.bridgeController', zwave.isBridgeController(), true);

        // delete all inactive devices
        var list = [];
        for (var id in objects) {
            if (!objects.hasOwnProperty(id)) continue;
            if (objects[id].type === 'device') {
                if (!nodes[objects[id].native.nodeID]) {
                    adapter.log.info('Delete ' + objects[id].native.nodeID);
                    getAllSubObjects(objects[id].native.nodeID, list);
                }
            }
        }
        delObjects(list, function () {
            // after deleting unneccessary devices, fix button states
            fixZwaveButtons();
        });
    });

    // ------------- nodes events ---------------------------
    zwave.on('node added', function (nodeID) { //first event on inclusion!
        extendInclusion();
        adapter.log.debug('node added for ' + nodeID + ' found');

        // Just remember, that such a nodeID created
        nodes[nodeID] = {id: calcName(nodeID), ready: false, native: null};
        if (inclusion) {
            extendNode(nodeID, {});
        }
    });

    zwave.on('node removed', function (nodeID) {
        adapter.log.info('node removed: ' + nodeID);
        deleteDevice(nodeID);
    });


    zwave.on('node available', function (nodeID, nodeInfo) {
        extendInclusion();
        adapter.log.debug('node available nodeID: ' + nodeID + ', nodeinfo: ' + JSON.stringify(nodeInfo));
        nodes[nodeID] = nodes[nodeID] || {id: calcName(nodeID), ready: false};
        extendNode(nodeID, nodeInfo);
        adapter.log.debug('nodeID ' + nodeID + ' is now available, but maybe not ready');
    });

    zwave.on('node naming', function (nodeID, nodeInfo) {
        extendInclusion();
        nodes[nodeID] = nodes[nodeID] || {id: calcName(nodeID), ready: false};
        adapter.log.debug('node naming nodeID: ' + nodeID + ' nodeinfo: ' + JSON.stringify(nodeInfo));
        extendNode(nodeID, nodeInfo);
    });

    zwave.on('node ready', function (nodeID, nodeInfo) {
        extendInclusion();
        adapter.log.info('node ready nodeID: ' + nodeID + ', nodeInfo: ' + JSON.stringify(nodeInfo));
        nodes[nodeID] = nodes[nodeID] || {id: calcName(nodeID), ready: false};
        extendNode(nodeID, nodeInfo, function (err) {
            if (!err) nodes[nodeID].ready = true;
            adapter.setForeignState(nodes[nodeID].id + '.ready', true, true);
            adapter.setForeignState(nodes[nodeID].id + '.alive', true, true);
            adapter.setForeignState(nodes[nodeID].id + '.awake', true, true);
        });
    });

    zwave.on('node event', function (nodeID, data) {
        adapter.log.debug('node' + nodeID + ': node event for ' + JSON.stringify(data) + ', only basic implementation');
        if (nodes[nodeID]) {
            extendNode(nodeID, {}, function() {
                adapter.setForeignState(nodes[nodeID].id + '.event', JSON.stringify(data), true);
            });
        } else {
            adapter.log.warn('Node event for non existing node: ' + nodeID);
        }
    });

    zwave.on('scene event', function (nodeID, sceneid) {
        adapter.log.debug('node' + nodeID + ': scene event for ' + sceneid + ', currently only partially implemented');

        // We save the scene id direct into a state (e.g. zwave.0.NODE3.scene)
        // if Configuration (e.g. zwave.0.NODE3.CONFIGURATION.Command_to_Control_Group_A) is set to "Send Scenes(4)"
        
        if (nodes[nodeID]) {
            adapter.log.debug(JSON.stringify(nodes[nodeID]));
            var id = adapter.namespace + ".NODE" + nodeID + ".scene";
            var object = objects[id];
            if (object === undefined || object === null) {
                adapter.log.warn("object + " + id  + " does not exist yet");

                var obj = {
                    "common": {
                        "name": "Received scenes from node",
                        "type": "mixed",
                        "role": "state",
                        "write": true,
                        "read": true
                    },
                    "native": {},
                    "type": "state"
                };
                adapter.setObject(id, obj);
            }
            adapter.log.debug("Put scene " + sceneid + " from node " + nodeID);
            adapter.setState(id, sceneid)
        }
    });

    zwave.on('polling enabled', function (nodeID) {
        adapter.log.info('node' + nodeID + ': polling ENABLED, currently not implemented');
    });

    zwave.on('polling disabled', function (nodeID) {
        adapter.log.info('node' + nodeID + ': polling DISABLED, currently not implemented');
    });

    // not found in documentation
    zwave.on('notification', function (nodeID, notif) {
        extendInclusion();
        switch (notif) {
            case 0:
                adapter.log.debug('node' + nodeID + ': message complete');
                break;
            case 1:
                adapter.log.debug('node' + nodeID + ': timeout');
                break;
            case 2:
                adapter.log.debug('node' + nodeID + ': nop');
                break;
            case 3:
                adapter.log.debug('node' + nodeID + ': node awake');
                adapter.setForeignState(calcName(nodeID) + '.sleep', false, true);
                break;
            case 4:
                adapter .log.debug('node' + nodeID + ': node sleep');
                adapter.setForeignState(calcName(nodeID) + '.sleep', true, true);
                break;
            case 5:
                adapter.log.debug('node' + nodeID + ': node dead');
                adapter.setForeignState(calcName(nodeID) + '.alive', false, true);
                break;
            case 6:
                adapter.log.debug('node' + nodeID + ': node alive');
                adapter.setForeignState(calcName(nodeID) + '.alive', true, true);
                break;
            default:
                adapter.log.debug('node' + nodeID + ': unknown notification ' + notif);
        }
    });

    // ------------- values events ---------------------------
    zwave.on('value added', function (nodeID, comClass, valueId) {
        extendInclusion();
        adapter.log.debug('value added: nodeID: ' + nodeID + ' comClass: ' + JSON.stringify(comClass) + ' value: '  + JSON.stringify(valueId));
        extendChannel(nodeID, comClass, valueId);
    });

    zwave.on('value changed', function (nodeID, comClass, valueId) {
        extendInclusion();
        adapter.log.debug('value changed: ' + nodeID + ' comClass: ' + JSON.stringify(comClass) + ' value: '  + JSON.stringify(valueId));
        extendChannel(nodeID, comClass, valueId);
    });

    zwave.on('value removed', function (nodeID, comClass, instance, index) {                
        adapter.log.debug('value removed: ' + nodeID + ' comClass: ' + JSON.stringify(comClass) + ' instance: ' + instance + ' index: '  + index);
        const id = calcName(nodeID, comClass);
        for (var i in objects) {
            if (!objects.hasOwnProperty(i)) continue;
            if (i.startsWith(id + '.') || i === id) {
                if (objects[i].native && objects[i].native.instance === instance && objects[i].native.index === index) {
                    delObjects([objects[i]]);
                    break;
                }
            }
        }        
    });

    zwave.on('value refreshed', function (nodeID, comClass, valueId) {
        adapter.log.debug('value refreshed nodeID: ' + nodeID + ', commandclass: ' + JSON.stringify(comClass) + ', value: ' + JSON.stringify(valueId));
        extendChannel(nodeID, comClass, valueId);
    });

    // ------------- controller events ---------------------------
    zwave.on('controller command', function (nodeId, state, error, helpMsg) {
        extendInclusion();
        adapter.log.info('controller command feedback for node ' + nodeId + ': state: "' + ctrlState[state] + '", error: "' + ctrlError[error] + '", helpmsg: "' + helpMsg + '"');
        adapter.setState('info.controllerMessage', JSON.stringify({
            state: state,
            error: error,
            helpMsg: helpMsg
        }), true);
    });

    zwave.connect(adapter.config.usb);
}

function extendInstanceObjects() {
    var fs = require('fs'),
        io = fs.readFileSync(path.join(__dirname, "io-package.json"), "utf8"),
        objs = JSON.parse(io);

    for (var i = 0; i < objs.instanceObjects.length; i++) {
        adapter.setObjectNotExists(objs.instanceObjects[i]._id, objs.instanceObjects[i]);
    }
}

if (module.parent) {
    // Export startAdapter in compact mode
    module.exports = startAdapter;
} else {
    // otherwise start the instance directly
    startAdapter();
}