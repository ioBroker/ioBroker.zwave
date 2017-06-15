/**
 *      ioBroker Z-Wave Adapter
 *
 *      Copyright 2016, bluefox <dogafox@gmail.com>
 *
 *      License: GNU LGPL
 */

var utils        = require(__dirname + '/lib/utils'); // Get common adapter utils
var comClasses   = require(__dirname + '/admin/js/comClasses.js');
var path;
var fs;
var zwave;

var objects      = {};
var nodes        = {};
var inclusion    = null;
var exclusion    = null;
var inclusionRepeat = null;
var exclusionRepeat = null;
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
    /*4: */ 'Controller is waiting for a user action',
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

var adapter = utils.adapter({
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
			OK: { error: null, result: 'ok' },
			ERROR_UNKNOWN_COMMAND: { error: 'Unknown command!' },
			ERROR_NOT_RUNNING: { error: 'zwave driver is not running!' },
			MISSING_PARAMETER: function (paramName) { return { error: 'missing parameter "' + paramName + '"!' };}
		}
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
            addNodeSecure = false;
            switch (obj.command) {
                case 'listUart':
                    if (obj.callback) {
                        var ports = listSerial();
						adapter.log.info('List of ports: ' + JSON.stringify(ports));
						respond(ports);
                    }
                    break;

                case 'softReset':
                case 'hardReset':
                case 'healNetwork':
                case 'getNeighbors':
                    if (zwave) {
                        disableInclusion();
                        disableExclusion();

                        // destructive! will wipe out all known configuration
                        adapter.log.info('Execute ' + obj.command);
                        if (zwave[obj.command]) {
							zwave[obj.command]();
							respond(predefinedResponses.OK);
                        } else {
							adapter.log.error('Unknown command!');
							respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                        }
                    } else {
						respond(predefinedResponses.ERROR_NOT_RUNNING);
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
                        disableInclusion();
                        disableExclusion();

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
                        disableInclusion();
                        disableExclusion();
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
                        disableInclusion();
                        disableExclusion();
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
                    if (inclusion) {
                        disableInclusion();
						respond(predefinedResponses.OK);
                        return;
                    }
                    disableExclusion();

                    if (zwave) {
                        adapter.log.info('Execute addNode ' + (addNodeSecure ? 'secure' : ''));
                        if (!inclusion) {
                            adapter.setState('inclusionOn', true, true);
                        } else {
                            clearTimeout(inclusion);
                        }

                        inclusion = setTimeout(function () {
                            inclusion = null;
                            adapter.setState('inclusionOn', false, true);
                        }, 60000);

                        zwave.addNode(addNodeSecure);
						respond(predefinedResponses.OK);
                    } else {
						respond(predefinedResponses.ERROR_NOT_RUNNING);
                    }
                    break;

                case 'removeNode':
                    if (exclusion) {
                        disableExclusion();
						respond(predefinedResponses.OK);
                        return;
                    }
                    disableInclusion();

                    if (zwave) {
                        adapter.log.info('Execute ' + obj.command);
                        if (!exclusion) {
                            adapter.setState('exclusionOn', true, true);
                        } else {
                            clearTimeout(exclusion);
                        }

                        exclusion = setTimeout(function () {
                            exclusion = null;
                            adapter.setState('exclusionOn', false, true);
                        }, 60000);
                        zwave.removeNode();
						respond(predefinedResponses.OK);
                    } else {
						respond(predefinedResponses.ERROR_NOT_RUNNING);
                    }
					break;

				// Association groups management functions:
				case 'getNumGroups': // zwave.getNumGroups(nodeid) => number;
					if (zwave && obj.message) {
						if (!requireParams(["nodeID"])) break;

						disableInclusion();
						disableExclusion();

						adapter.log.info('Requesting number of association groups from node' + obj.message.nodeID);
						if (zwave[obj.command]) {
							var result = zwave[obj.command](obj.message.nodeID);
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

						disableInclusion();
						disableExclusion();

						adapter.log.info('Requesting label of association group ' + obj.message.group + ' from node ' + obj.message.nodeID);
						if (zwave[obj.command]) {
							var result = zwave[obj.command](obj.message.nodeID, obj.message.group);
							respond({ error: null, result: result });
						} else {
							adapter.log.error('Unknown command!');
							respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
						}
					} else {
						respond(predefinedResponses.ERROR_NOT_RUNNING);
					}
					break;

				case 'getAssociations': // zwave.getAssociations(nodeid, group);
					if (zwave && obj.message) {
						if (!requireParams(["nodeID", "group"])) break;

						disableInclusion();
						disableExclusion();

						adapter.log.info('Requesting associations in group ' + obj.message.group + ' from node ' + obj.message.nodeID);
						if (zwave[obj.command]) {
							var result = zwave[obj.command](obj.message.nodeID, obj.message.group);
							respond({ error: null, result: result });
						} else {
							adapter.log.error('Unknown command!');
							respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
						}
					} else {
						respond(predefinedResponses.ERROR_NOT_RUNNING);
					}
					break;

				case 'getMaxAssociations': // zwave.getMaxAssociations(nodeid, group);
					if (zwave && obj.message) {
						if (!requireParams(["nodeID", "group"])) break;

						disableInclusion();
						disableExclusion();

						adapter.log.info('Requesting max number of associations in group ' + obj.message.group + ' from node ' + obj.message.nodeID);
						if (zwave[obj.command]) {
							var result = zwave[obj.command](obj.message.nodeID, obj.message.group);
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

						disableInclusion();
						disableExclusion();

						adapter.log.info('Adding association with node ' + obj.message.target_nodeid + ' to group ' + obj.message.group + ' of node ' + obj.message.nodeID);
						if (zwave[obj.command]) {
							zwave[obj.command](obj.message.nodeID, obj.message.group, obj.message.target_nodeid);
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

						disableInclusion();
						disableExclusion();

						adapter.log.info('Removing association with node ' + obj.message.target_nodeid + ' from group ' + obj.message.group + ' of node ' + obj.message.nodeID);
						if (zwave[obj.command]) {
							zwave[obj.command](obj.message.nodeID, obj.message.group, obj.message.target_nodeid);
							respond(predefinedResponses.OK);
						} else {
							adapter.log.error('Unknown command!');
							respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
						}
					} else {
						respond(predefinedResponses.ERROR_NOT_RUNNING);
					}
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
                }
                else {
                    // set a value
                    adapter.log.debug('setState for: nodeID=' + obj.native.node_id + ': comClass=' + obj.native.class_id + ': index=' + obj.native.index + ': instance=' + obj.native.instance + ': value=' + value);
                    if (zwave) zwave.setValue(obj.native.node_id, obj.native.class_id, obj.native.instance, obj.native.index, value);
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
});

function filterSerialPorts(path) {
    // get only serial port names
    if (!(/(tty(S|ACM|USB|AMA|MFD)|rfcomm)/).test(path)) return false;

    return fs
        .statSync(path)
        .isCharacterDevice();
}

function listSerial() {
    path = path || require('path');
    fs   = fs   || require('fs');

    // Filter out the devices that aren't serial ports
    var devDirName = '/dev';

    var result;
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

function disableInclusion() {
    if (inclusion) {
        if (zwave) zwave.cancelControllerCommand();
        adapter.log.info('Disable inclusion mode');
        clearTimeout(inclusion);
        inclusion = null;
        adapter.setState('inclusionOn', false, true);
        return true;
    }
    return false;
}

function disableExclusion() {
    if (exclusion) {
        if (zwave) zwave.cancelControllerCommand();
        adapter.log.info('Disable exclusion mode');
        clearTimeout(exclusion);
        exclusion = null;
        adapter.setState('exclusionOn', false, true);
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

function calcName(nodeID, comClass, idx, instance) {
    var name = adapter.namespace + '.NODE' + nodeID;
    if (comClass) {
        name += '.' + ((comClasses[comClass] ? comClasses[comClass].name : '') || ('CLASSES' + comClass));

        if (idx !== undefined) {
            idx = idx.replace(/[.\s]+/g, '_');
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
        var devObj = {
            common: {
                name: nodeInfo.name || nodeInfo.manufacturer ? nodeInfo.name || (nodeInfo.manufacturer + ' ' + nodeInfo.product) : '',
                role: 'state'
            },
            native: nodeInfo,
            type:  'device'
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
    if (nodeInfo.loc) {
        var roomId = 'enum.rooms.' + nodeInfo.loc.replace(/\s/g, '_');
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
            adapter.log.info('State updated: ' + stateID + ' = ' + value + ', index = ' + valueId.index + ', comClass = ' + comClass + ', instance = ' + valueId.instance);
            adapter.extendForeignObject(stateID, stateObj);
        }
        if (value !== undefined) adapter.setForeignState(stateID, value, true);
    } else {
        stateObj = {
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
        };
        if (valueId.units)               stateObj.common.unit = valueId.units;

        if (valueId.type === 'byte' || valueId.type === 'int' || valueId.type === 'decimal' || valueId.type === 'short') stateObj.common.type = 'number';
        if (valueId.type === 'bool') stateObj.common.type = 'boolean';
        if (valueId.type === 'string') stateObj.common.type = 'string';

        if (valueId.type === 'button') {
            stateObj.common.type  = 'boolean';
            stateObj.common.role  = 'button';
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

function deleteDevice(nodeID) {
    delObjects(getAllSubObjects(nodeID));

    if (nodes[nodeID]) delete nodes[nodeID];
}

function resetInstanceStatusInfo() {
	// resets states with information about adapter status
	adapter.setState('info.connection', false, true);
	adapter.setState('info.scanCompleted', false, true);
	adapter.setState('inclusionOn', false, true);
	adapter.setState('exclusionOn', false, true);
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
        NetworkKey:           adapter.config.networkkey          // 0102..- use for secure connections
    });

    // ------------- controller events ---------------------------
    zwave.on('connected', function (homeid) {
        adapter.setState('info.connection', true, true);
        adapter.log.info('connected: homeid = ' + homeid);
    });

    zwave.on('driver ready', function (homeid) {
        adapter.log.info('scanning homeid=0x' + homeid.toString(16) + '...');

        adapter.log.info('driver ready: homeid = ' + homeid);
    });

    zwave.on('driver failed', function () {
        adapter.setState('info.connection', false, true);
        adapter.log.error('failed to start driver');
        zwave.disconnect(adapter.config.usb);
        process.exit();
    });

    zwave.on('scan complete', function () {
        adapter.setState('forceInit', false, true);
        adapter.log.info('Scan completed');
        adapter.setState('info.scanCompleted', true, true);
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
        delObjects(list);
    });

    // ------------- nodes events ---------------------------
    zwave.on('node added', function (nodeID) {
        adapter.log.debug('node added for ' + nodeID + ' found');

        // Just remember, that such a nodeID created
        nodes[nodeID] = {id: calcName(nodeID), ready: false, native: null};
        extendNode(nodeID, {});
    });

    zwave.on('node available', function (nodeID, nodeInfo) {
        adapter.log.debug('node available nodeID: ' + nodeID + ', nodeinfo: ' + JSON.stringify(nodeInfo));
        nodes[nodeID] = nodes[nodeID] || {id: calcName(nodeID), ready: false};
        extendNode(nodeID, nodeInfo);
        adapter.log.debug('nodeID ' + nodeID + ' is now available, but maybe not ready');
    });

    zwave.on('node naming', function (nodeID, nodeInfo) {
        nodes[nodeID] = nodes[nodeID] || {id: calcName(nodeID), ready: false};
        adapter.log.debug('node naming nodeID: ' + nodeID + ' nodeinfo: ' + JSON.stringify(nodeInfo));
        extendNode(nodeID, nodeInfo);
    });

    zwave.on('node ready', function (nodeID, nodeInfo) {
        adapter.log.info('node ready nodeID: ' + nodeID + ', nodeInfo: ' + JSON.stringify(nodeInfo));
        nodes[nodeID] = nodes[nodeID] || {id: calcName(nodeID), ready: false};
        extendNode(nodeID, nodeInfo, function (err) {
            if (!err) nodes[nodeID].ready = true;
            adapter.setForeignState(nodes[nodeID].id + '.ready', true, true);

            adapter.setForeignState(nodes[nodeID].id + '.alive', true, true);
            adapter.setForeignState(nodes[nodeID].id + '.awake', true, true);

            if (inclusion) {
                if (!inclusionRepeat) {
                    inclusionRepeat = setTimeout(function () {
                        inclusionRepeat = null;
                        if (inclusion) {
                            adapter.log.info('Continue to add devices');
                            adapter.setState('info.controllerMessage', JSON.stringify({state: 15}), true);
                            zwave.addNode(addNodeSecure);
                        }
                    }, 5000);
                }
            }
        });
    });

    zwave.on('node event', function (nodeID, data) {
        adapter.log.debug('node' + nodeID + ': node event for ' + JSON.stringify(data) + ', currently not implemented');
        if (nodes[nodeID]) {

        } else {
            adapter.log.warn('Node event for non existing node: ' + nodeID);
        }

    });

    zwave.on('scene event', function (nodeID, sceneid) {
        adapter.log.debug('node' + nodeID + ': scene event for ' + sceneid + ', currently not implemented');
        /*
         For example when you have your Aeon Labs Minimote setup with the following configuration:

         - zwave.setConfigParam(nodeID, 241, 1, 1);
         - zwave.setConfigParam(nodeID, 242, 1, 1);
         - zwave.setConfigParam(nodeID, 243, 1, 1);
         - zwave.setConfigParam(nodeID, 244, 1, 1);
         - zwave.setConfigParam(nodeID, 250, 1, 1);

         It would send:

         - sceneid of 1 when (1) is Pressed
         - sceneid of 2 when (1) is Held
         - sceneid of 3 when (2) is Pressed
         - etc.
         */
    });

    zwave.on('polling enabled', function (nodeID) {
        adapter.log.debug('node' + nodeID + ': polling ENABLED, currently not implemented');
    });

    zwave.on('polling disabled', function (nodeID) {
        adapter.log.debug('node' + nodeID + ': polling DISABLED, currently not implemented');
    });

    // not found in documentation
    zwave.on('notification', function (nodeID, notif) {
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
        }
    });

    // ------------- values events ---------------------------
    zwave.on('value added', function (nodeID, comClass, valueId) {
        adapter.log.debug('value added: nodeID: ' + nodeID + ' comClass: ' + JSON.stringify(comClass) + ' value: '  + JSON.stringify(valueId));
        extendChannel(nodeID, comClass, valueId);
    });

    zwave.on('value changed', function (nodeID, comClass, valueId) {
        adapter.log.debug('value changed: ' + nodeID + ' comClass: ' + JSON.stringify(comClass) + ' value: '  + JSON.stringify(valueId));
        extendChannel(nodeID, comClass, valueId);
    });

    zwave.on('value removed', function (nodeID, comClass, instance, index) {
        adapter.log.info('value removed: ' + nodeID + ' comClass: ' + JSON.stringify(comClass) + ' instance ' + instance + ' value: '  + JSON.stringify(index));

        deleteDevice(nodeID);
        if (exclusion) {
            if (!exclusionRepeat) {
                exclusionRepeat = setTimeout(function () {
                    exclusionRepeat = null;
                    if (exclusion) {
                        adapter.log.info('Continue to remove devices');
                        adapter.setState('info.controllerMessage', JSON.stringify({state: 14}), true);
                        zwave.removeNode();
                    }
                }, 5000);
            }
        }
    });

    zwave.on('value refreshed', function (nodeID, comClass, valueId) {
        adapter.log.debug('value refreshed nodeID: ' + nodeID + ', commandclass: ' + JSON.stringify(comClass) + ', value: ' + JSON.stringify(valueId) + ', currently not implemented');
        extendChannel(nodeID, comClass, valueId);
    });

    // ------------- controller events ---------------------------
    zwave.on('controller command', function (nodeId, state, error, helpMsg) {
        adapter.log.info('controller command feedback: state: "' + ctrlState[state] + '", error: "' + ctrlError[error] + '", helpmsg: "' + helpMsg + '"');
        adapter.setState('info.controllerMessage', JSON.stringify({state: state, error: error, helpMsg: helpMsg}), true);
    });

    zwave.connect(adapter.config.usb);
}
