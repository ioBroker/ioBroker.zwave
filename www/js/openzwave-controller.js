/**
 *      openzwave-configurator
 *
 *  Copyright (c) 2015 husky-koglhof
 *
 *  CC BY-NC-SA 4.0 (http://creativecommons.org/licenses/by-nc-sa/4.0/)
 *
 */

"use strict";

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

;(function ($) {
    $(document).ready(function () {

        var language = 'de';

        var listDevices;
        var indexDevices;
        var names = {};
        var hash;

        var $body =                         $('body');
        var $gridDevices =                  $('#grid-devices');
        var $subgrid =                      $('#subgrid');
        var $tabsMain =                     $('#tabs-main');
        var $dialogHelp =                   $('#dialog-help');

        var $dialogSetLocation =            $('#dialog-setlocation');
        var $dialogSetName =                $('#dialog-setname');
        var $dialogparamsetValues =         $('#dialog-paramsetValues');
        var $dialogAddCountdown =           $('#dialog-add-countdown');

        servConn.init(null, {
            onConnChange: function (isConnected) {
                console.log("onConnChange isConnected=" + isConnected);
                getConfig();
                getDevices();
            }
        });

        // i18n
        function _(word) {
            if (translation[word]) {
                if (translation[word][language]) {
                    return translation[word][language];
                }
            }
            if (!missesTranslation[word]) {
                console.log('missing translation for "' + word + '"');
                missesTranslation[word] = {de: word, en: word};
            }

            return word;
        }
        function translate() {
            $('.translate').each(function () {
                var $this = $(this);
                $this.html(_($this.html()));
            });
            $('.translateT').each(function () {
                var $this = $(this);
                $this.attr('title', _($this.attr('title')));
            });
        }

        function getConfig() {
            //servConn._socket.emit('getConfig', function (data) {
            servConn._socket.emit('getObject', 'system.adapter.zwave', function (err, obj) {
                $('.version').html(obj.common.installedVersion);

                servConn._socket.emit('getObject', "system.config", function (err, config) {
                    language = config.language || 'de';
                    translate();

                    initTabs();
                    initDialogsMisc();
                    initGridDevices();
                    var tmp = window.location.hash.slice(1).split('/');
                    hash = tmp[1];

                    var count = 0;

                    if (tmp[2]) {
                        var index = $('#tabs-main a[href="#' + tmp[2] + '"]').parent().index();
                        $tabsMain.tabs("option", "active", index - 2);
                    }

                    // at this point everything should be initialized
                    $('#loader').hide('fade');
                });
            });
        }

        function initTabs() {
            $tabsMain.tabs({

                activate: function(event ,ui){
                    resizeGrids();
                    var tab = ui.newTab[0].children[0].hash.slice(1);
                    if (hash) window.location.hash = '/' + hash + '/' + tab;
                },
                create: function () {
                    $('#tabs-main ul.ui-tabs-nav').prepend('<li class="header">OpenZWave Configurator</li>');

                    $(".ui-tabs-nav").
                        append("<button title='Help' class='menu-button translateT' id='button-help'></button>");
                    $('#button-help').button({
                        text: false,
                        icons: {
                            primary: 'ui-icon-help'
                        }
                    }).click(function () {
                        $dialogHelp.dialog('open');
                    });
                }
            });
        }

        function initDialogsMisc() {
            $dialogHelp.dialog({
                autoOpen: false,
                modal: true,
                width: 640,
                height: 400
            });
        }

        var states = {};
        var objects = {};
        var enums = [];
        var metadata = {};

        function getData(callback) {
            $('#load_grid-devices').show();

            var objectsReady;
            var statesReady;

            console.log('requesting all states');
            servConn.getStates('*', function (err, res) {
                $('#load_grid-devices').hide();
                states = res;
                statesReady = true;
                console.log('received all states');
                if (objectsReady && typeof callback === 'function') callback();
            });

            console.log('requesting all objects');

            servConn.getObjects(function (err, res) {
                $('#load_grid-devices').hide();
                metadata = {};
                objects = {};
                enums = [];
                for (var object in res) {
                    var obj = res[object];
                    if (obj._id.search("zwave") == 0) {
                        if (obj.type == "device") {
                            objects[obj._id] = obj;
                        } else {
                            metadata[obj._id] = obj;
                        }
                    }
                    if (res[object].type === 'enum') enums.push(res[object]._id);
                }
                objectsReady = true;
                console.log('received all objects');
                if (statesReady && typeof callback === 'function') callback();
            });
        }

        var listDevices;
        // Devices
        function getDevices(callback) {
            getData( function() {
                listDevices = objects;
                console.log(listDevices);
                refreshGridDevices();
            });
        }

        var scrollPosition = 0;
        var ids = [];

        function RefreshGridData() {
            var num;
            ids = new Array();
            $("#grid-devices tr:has(.sgexpanded)").each(function () {
                num = $(this).attr('id');
                ids.push(num);
            });
            $gridDevices.trigger("reloadGrid");
        }

        function initGridDevices() {
            $gridDevices.jqGrid({
                colNames: ['Node Id', 'Basic Type', 'Generic Type', 'Product', 'Name', 'Location', 'Value', 'Last Heard', 'Status'],
                colModel: [
                    {name:'nodeid', index: 'nodeid', width: 100, fixed: false, classes: 'device-cell'},
                    {name:'basictype', index: 'basictype', width: 100, fixed: false, classes: 'device-cell'},
                    {name:'generictype', index: 'genericype', width: 400, fixed: false, classes: 'device-cell'},
                    {name:'product', index: 'product', width: 400, fixed: false, classes: 'device-cell'},
                    {name:'name', index: 'name', width: 224, fixed: false, classes: 'device-cell'},
                    {name:'location', index: 'location', width: 224, fixed: false, classes: 'device-cell'},
                    {name:'value', index: 'value', width: 100, fixed: false, classes: 'device-cell'},
                    {name:'lastheard', index: 'lastheard', width: 100, fixed: false, classes: 'device-cell'},
                    {name:'status', index: 'status', width: 100, fixed: false, classes: 'device-cell'},
                ],
                idPrefix:   'zwave',
                datatype:   'local',
                rowNum:     100,
                autowidth:  true,
                width:      '1000',
                height:     '600',
                rowList:    [25, 50, 100, 500],
                pager:      $('#pager-devices'),
                sortname:   'timestamp',
                viewrecords: true,
                sortorder:  'desc',
                caption:    _('Devices'),
                subGrid:    true,
                ignoreCase: true,
                subGridRowExpanded: function(grid_id, row_id) {
                    subGridChannels(grid_id, row_id);
                },
                ondblClickRow: function (rowid, iRow, iCol, e) {
                    removeSelectionAfterDblClick();
                    $gridDevices.jqGrid('toggleSubGridRow', rowid);
                },
                onSelectRow: function (rowid, iRow, iCol, e) {
                    $('#setName').addClass('ui-state-enabled');
                    $('#setLocation').addClass('ui-state-enabled');
                    $('#refreshNode').addClass('ui-state-enabled');
                },
                gridComplete: function () {
                    for (var j = 0; j < ids.length; j = j + 1) {
                        $gridDevices.jqGrid('expandSubGridRow', ids[j]);
                    }
                }
            }).navGrid('#pager-devices', {
                search: false,
                edit: false,
                add: false,
                del: false,
                refresh: false
                /*
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-pencil',
                 onClickButton: dialogSetName,
                 position: 'last',
                 id: 'setName',
                 title: _('Set Name'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-image',
                 onClickButton: dialogSetLocation,
                 position: 'last',
                 id: 'setLocation',
                 title: _('Set Location'),
                 cursor: 'pointer'
                 */
            }).jqGrid('navButtonAdd', '#pager-devices', {
                caption: '',
                buttonicon: 'ui-icon-minus',
                onClickButton: removeDevice,
                position: 'first',
                id: 'removeDevice',
                title: _('Remove Device(s)'),
                cursor: 'pointer'
            }).jqGrid('navButtonAdd', '#pager-devices', {
                caption: '',
                buttonicon: 'ui-icon-plus',
                onClickButton: addDevice,
                position: 'first',
                id: 'addDevice',
                title: _('Add Device(s)'),
                cursor: 'pointer'
            }).jqGrid('navButtonAdd', '#pager-devices', {
                caption: '',
                buttonicon: 'ui-icon-refresh',
                onClickButton: refreshDevices,
                position: 'first',
                id: 'refresh',
                title: _('Refresh'),
                cursor: 'pointer'
                /*
                 // TODO: ADD SUPPORT FOR THIS FUNCTIONS
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-clock',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'setPolling',
                 title: _('Set Polling'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-home',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'createPrimary',
                 title: _('Create Primary'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-arrowrefresh-1-e',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'receiveConfiguration',
                 title: _('Receive Configuration'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-trash',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'removeDevice',
                 title: _('Remove Device'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-close',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'removeFailedNode',
                 title: _('Remove Failed Node'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-notice',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'hasNodeFailed',
                 title: _('Has Node Failed'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-alert',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'replaceFailedNode',
                 title: _('Replace Failed Node'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-arrow-1-e',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'transferPrimaryRole',
                 title: _('Transfer Primary Role'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-shuffle',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'requestNetworkUpdate',
                 title: _('Request Network Update'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-transfer-e-w',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'requestNodeNeighborUpdate',
                 title: _('Request Node Neighbor Update'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-arrow-1-w',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'assignReturnRoute',
                 title: _('Assign Return Route'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-arrowreturnthick-1-w',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'deleteAllReturnRoutes',
                 title: _('Delete All Return Routes'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-arrowrefresh-1-n',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'sendNodeInformation',
                 title: _('Send Node Information'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-link',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'replicationSend',
                 title: _('Replication Send'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-zoomin',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'addButton',
                 title: _('Add Button'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-zoomout',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'deleteButton',
                 title: _('Delete Button'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-circle-triangle-e',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'scenes',
                 title: _('Scenes'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-circle-triangle-s',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'topology',
                 title: _('Topology'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-circle-triangle-w',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'statistics',
                 title: _('Statistics'),
                 cursor: 'pointer'
                 }).jqGrid('navButtonAdd', '#pager-devices', {
                 caption: '',
                 buttonicon: 'ui-icon-circle-triangle-n',
                 onClickButton: getDevices,
                 position: 'first',
                 id: 'testAndHeal',
                 title: _('Test & Heal'),
                 cursor: 'pointer'
                 */
            }).jqGrid('filterToolbar', {
                defaultSearch: 'cn',
                autosearch: true,
                searchOnEnter: false,
                enableClear: false,
                beforeSearch: function () {
                    var postdata = $gridDevices.jqGrid('getGridParam', 'postData');
                    console.log('beforeSearch', postdata);

                }
            });
            $gridDevices.contextmenu({
                delegate: "td.device-cell",
                menu: [
                    {title: _("Set Name"), cmd: "dialogSetName", uiIcon: "ui-icon-pencil"},
                    {title: _("Set Location"), cmd: "dialogSetLocation", uiIcon: "ui-icon-image"},
                    {title: _("Refresh Node"), cmd: "refreshNode", uiIcon: "ui-icon-refresh"},
                    /*
                     // TODO: ADD SUPPORT FOR THIS FUNCTIONS
                     {title: _("Set Group"), cmd: "setGroup", uiIcon: "ui-icon-newwin"},
                     {title: _("Set Polling"), cmd: "setPolling", uiIcon: "ui-icon-clock"},
                     {title: "----"},
                     {title: _("Receive Configuration"), cmd: "receiveConfiguration", uiIcon: "ui-icon-arrowrefresh-1-e"},
                     {title: "----"},
                     {title: _("Remove Device"), cmd: "removeDevice", uiIcon: "ui-icon-trash"}
                     */
                ],
                select: function(event, ui) {
                    var cmd = ui.cmd;
                    var address = ui.target.parent().find('[aria-describedby$="_ADDRESS"]').text();
                    switch (cmd) {
                        case 'dialogSetName':
                            dialogSetName();
                            break;
                        case 'dialogSetLocation':
                            dialogSetLocation();
                            break;
                        case 'refreshNode':
                            refreshNode();
                        case 'delete':
                            break;
                        default:
                            alert("todo " + cmd + " on " + address);
                    }
                }
            });

            $dialogSetName.dialog({
                autoOpen: false,
                modal: true,
                width: 400,
                height: 200,
                buttons: [
                    {
                        text: _('Save'),
                        click: function () {
                            var $that = $(this);
                            var renameAddress = $('#rename-address').val();
                            var renameName = $('#rename-name').val();
                            var rowid = $('#rename-rowid').val();
                            var gridid = $('#rename-gridid').val();

                            servConn._socket.emit('setState', 'zwave.0.NODE'+renameAddress, {
                                val: {nodeid:renameAddress, name:renameName, action:"setName"},
                                ack: true
                            }, function (res, err) {
                                console.log("result: " + res);
                                console.log("error: " + err);

                                $that.dialog('close');

                                var time = 10;
                                $dialogAddCountdown.dialog('open');
                                var addInterval = setInterval(function () {
                                    time = time - 1;
                                    $('#add-countdown').html(time);
                                    if (time < 1) {
                                        clearInterval(addInterval);
                                        $dialogAddCountdown.dialog('close');
                                        addInterval = null;

                                        refreshDevices();
                                    }
                                }, 1000);
                            });

                        }
                    },
                    {
                        text: _('Cancel'),
                        click: function () {
                            $(this).dialog('close');
                        }
                    }
                ]
            });


            $dialogSetLocation.dialog({
                autoOpen: false,
                modal: true,
                width: 400,
                height: 200,
                buttons: [
                    {
                        text: _('Save'),
                        click: function () {
                            var $that = $(this);
                            var renameAddress = $('#rename-address').val();
                            var renameName = $('#rename-loc').val();
                            var rowid = $('#rename-rowid').val();
                            var gridid = $('#rename-gridid').val();

                            servConn._socket.emit('setState', 'zwave.0.NODE'+renameAddress, {
                                val: {nodeid:renameAddress, name:renameName, action:"setLocation"},
                                ack: true
                            }, function (res, err) {
                                console.log("result: " + res);
                                console.log("error: " + err);

                                $that.dialog('close');
                                var time = 10;
                                $dialogAddCountdown.dialog('open');
                                var addInterval = setInterval(function () {
                                    time = time - 1;
                                    $('#add-countdown').html(time);
                                    if (time < 1) {
                                        clearInterval(addInterval);
                                        $dialogAddCountdown.dialog('close');
                                        addInterval = null;

                                        refreshDevices();
                                    }
                                }, 1000);
                            });

                        }
                    },
                    {
                        text: _('Cancel'),
                        click: function () {
                            $(this).dialog('close');
                        }
                    }
                ]
            });

            $dialogAddCountdown.dialog({
                autoOpen: false,
                modal: true,
                width: 400,
                height: 200
            });

            function refreshDevices() {
                RefreshGridData();
                getDevices();
            }

            function refreshNode() {
                var devSelected = $gridDevices.jqGrid('getGridParam','selrow');

                var address = $('#grid-devices tr#' + devSelected + ' td[aria-describedby="grid-devices_nodeid"]').html();

                servConn._socket.emit('setState', 'zwave.0.NODE'+address, {
                    val: {nodeid:'zwave.0.NODE' + address, name:'zwave.0.NODE' + address, action:"refreshNode"},
                    ack: true
                }, function (res, err) {
                    $('#add-countdown').html(time);
                    $dialogAddCountdown.dialog('open');
                    var time = 10;
                    var addInterval = setInterval(function () {
                        time = time - 1;
                        $('#add-countdown').html(time);
                        if (time < 1) {
                            clearInterval(addInterval);
                            $dialogAddCountdown.dialog('close');
                            addInterval = null;

                            refreshDevices();
                        }
                    }, 1000);
                });
            }

            function removeDevice() {
                servConn._socket.emit('setState', 'zwave.0.NODE1', {
                    val: {nodeid:'zwave.0.NODE1', name:'zwave.0.NODE1', action:"removeNode"},
                    ack: true
                }, function (res, err) {
                    $('#add-countdown').html(time);
                    $dialogAddCountdown.dialog('open');
                    var time = 30;
                    var addInterval = setInterval(function () {
                        time = time - 1;
                        $('#add-countdown').html(time);
                        if (time < 1) {
                            clearInterval(addInterval);
                            $dialogAddCountdown.dialog('close');
                            addInterval = null;

                            refreshDevices();
                        }
                    }, 1000);
                });
            }

            function addDevice() {
                servConn._socket.emit('setState', 'zwave.0.NODE1', {
                    val: {nodeid:'zwave.0.NODE1', name:'zwave.0.NODE1', action:"addNode"},
                    ack: true
                }, function (res, err) {
                    $('#add-countdown').html(time);
                    $dialogAddCountdown.dialog('open');
                    var time = 60;
                    var addInterval = setInterval(function () {
                        time = time - 1;
                        $('#add-countdown').html(time);
                        if (time < 1) {
                            clearInterval(addInterval);
                            $dialogAddCountdown.dialog('close');
                            addInterval = null;

                            refreshDevices();
                        }
                    }, 1000);
                });
            }

            function subGridChannels(grid_id, row_id) {
                var subgrid_table_id = 'channels_' + row_id + '_t';
                $('#' + grid_id).html('<table id="' + subgrid_table_id + '"></table>');
                var gridConf = {
                    datatype: 'local',
                    // TODO: Implement Help Function
                    colNames: ['Comclass', 'Genre', 'Index', 'Instance', 'Label', 'Min', 'Max', 'Read Only', 'Write Only', 'Type', 'Units', 'Value', 'Node Id', 'Name', /*'Help'*/],
                    colModel: [
                        {name:'comclass', index: 'comclass', width: 120, fixed: false, classes: 'sub-cell'},
                        {name:'genre', index: 'genre', width: 100, fixed: false, classes: 'sub-cell'},
                        {name:'index', index: 'index', width: 100, fixed: false, classes: 'sub-cell'},
                        {name:'instance', index: 'instance', width: 100, fixed: false, classes: 'sub-cell'},
                        {name:'label', index: 'label', width: 600, fixed: false, classes: 'sub-cell'},
                        {name:'min', index: 'min', width: 120, fixed: false, classes: 'sub-cell'},
                        {name:'max', index: 'max', width: 120, fixed: false, classes: 'sub-cell'},
                        {name:'read_only', index: 'read_only', width: 120, fixed: false, classes: 'sub-cell'},
                        {name:'write_only', index: 'write_only', width: 120, fixed: false, classes: 'sub-cell'},
                        {name:'type', index: 'type', width: 120, fixed: false, classes: 'sub-cell'},
                        {name:'units', index: 'units', width: 100, fixed: false, classes: 'sub-cell'},
                        {name:'value', index: 'value', width: 120, fixed: false, classes: 'sub-cell'},
                        {name:'nodeid', index: 'nodeid', width: 0, fixed: false, classes: 'sub-cell', hidden: true},
                        {name:'name', index: 'name', width: 0, fixed: false, classes: 'sub-cell', hidden: true},
                        // TODO: Implement Help Function
                        // {name:'help', index: 'help', width: 0, fixed: false, classes: 'sub-cell', hidden: true},
                    ],
                    rowNum: 1000000,
                    autowidth: true,
                    height: 'auto',
                    width: 1000,
                    sortorder: 'desc',
                    viewrecords: true,
                    ignoreCase: true,
                    onSelectRow: function (rowid, e) {
                        $('#setName').addClass('ui-state-disabled');
                        $('#setLocation').addClass('ui-state-disabled');

                        // unselect devices grid
                        $gridDevices.jqGrid('resetSelection');
                    },
                    gridComplete: function () {
                    }
                };
                var $subgrid = $('#' + subgrid_table_id)
                $subgrid.jqGrid(gridConf);
                var device;

                var rowData = [];
                for (var i in listDevices) {
                    if (listDevices[i].gridid != undefined) {
                        var gridid = "zwave" + listDevices[i].gridid;
                        if (gridid == row_id) {
                            var classes = listDevices[i].native.classes;
                            for (var clazz in classes) {
                                var cl = classes[clazz];
                                for (var claz in cl) {
                                    var clz = cl[claz];
                                    if (clz.genre != "user") {
                                        device = new Object();

                                        device.comclass = clz.comclass;
                                        device.genre = clz.genre;
                                        device.index = clz.index;
                                        device.instance = clz.instance;
                                        device.label = clz.label;
                                        device.max = clz.max;
                                        device.min = clz.min;
                                        device.nodeid = clz.nodeid;
                                        if (clz.genre == "basic") {
                                            device.read_only = true;
                                        } else {
                                            device.read_only = clz.read_only;
                                        }
                                        device.type = clz.type;
                                        device.units = clz.units;
                                        device.value = clz.value;
                                        device.write_only = clz.write_only;
                                        // TODO: Implement Help Function
                                        // device.help = clz.help;

                                        device.name = calcName(device.nodeid, device.comclass, device.label);

                                        rowData.push(device);
                                    }
                                }
                            }
                        }
                    }
                }
                $subgrid.jqGrid('addRowData', '_id', rowData);
                $subgrid.trigger('reloadGrid');

            }

            $body.contextmenu({
                delegate: "td.sub-cell",
                menu: [
                    {title: _("Change Parameter(s)"), cmd: "paramsetValues", uiIcon: "ui-icon-gear"}
                ],
                beforeOpen: function(event, ui) {
                    var read_only = ui.target.parent().find('[aria-describedby$="_read_only"]').text();
                    var genre = ui.target.parent().find('[aria-describedby$="_genre"]').text();

                    if (read_only == "false") {
                        $body.contextmenu("enableEntry", 'paramsetValues', true);
                    } else {
                        $body.contextmenu("enableEntry", 'paramsetValues', false);
                    }
                },
                select: function(event, ui) {
                    var cmd = ui.cmd;

                    switch (cmd) {
                        case 'paramsetValues':
                            dialogparamsetValues(ui.target.parent());
                            break;
                        default:
                            alert("todo " + cmd + " on " + address);
                    }
                }
            });

            $dialogparamsetValues.dialog({
                autoOpen: false,
                modal: true,
                width: 'auto',
                height: 'auto',
                buttons: [
                    {
                        text: _('Save'),
                        click: function () {
                            var $that = $(this);
                            var val = $('#input-value').val();
                            var nodeid = $('#nodeid').val();
                            var label = $('#label').val();
                            var index = $('#index').val();
                            var address = $('#address').val();
                            var genre = $('#genre').val();
                            var comclass = $('#comclass').val();
                            var name = $('#name').val();

                            /*
                             "value_id": "7-39-1-0",
                             "node_id": 7,
                             "class_id": 39,
                             "type": "list",
                             "genre": "system",
                             "instance": 1,
                             "index": "0",
                             */
                            if (genre == "config") {
                                servConn._socket.emit('setState', name, {
                                    val: {nodeid:nodeid, action:"changeConfig", paramId: index, paramValue: val, label: label, index: index, comclass: comclass},
                                    ack: true
                                }, function (res, err) {
                                    $that.dialog('close');
                                });
                            } else if (genre == "system") {
                                servConn._socket.emit('setState', name, {
                                    val: {nodeid:nodeid, action:"changeSystem", paramId: index, paramValue: val, label: label, index: index, comclass: comclass},
                                    ack: true
                                }, function (res, err) {
                                    $that.dialog('close');
                                });
                            }

                            var time = 5;
                            $('#add-countdown').html(time);
                            $dialogAddCountdown.dialog('open');
                            var addInterval = setInterval(function () {
                                time = time - 1;
                                $('#add-countdown').html(time);
                                if (time < 1) {
                                    clearInterval(addInterval);
                                    $dialogAddCountdown.dialog('close');
                                    addInterval = null;

                                    refreshDevices();
                                }
                            }, 1000);
                        }
                    },
                    {
                        text: _('Cancel'),
                        click: function () {
                            $(this).dialog('close');
                        }
                    }
                ]
            });

        }
        function refreshGridDevices() {
            if (!listDevices) {
                alert('error: listDevices empty');
                return;
            }
            $gridDevices.jqGrid('clearGridData', true);
            var rowData = [];
            var device;
            var x = 0;
            for (var i in listDevices) {
                device = new Object();
                device.nodeid = listDevices[i].native.nodeid;
                device.basictype = "";
                device.generictype = listDevices[i].native.type;
                device.product = listDevices[i].native.product;
                device.name = listDevices[i].native.name;
                device.location = listDevices[i].native.loc;
                device.value = "";
                device.lastheard = "";
                device.status = "";
                //listDevices[i].gridid = i+1;
                x=x+1;
                listDevices[i].gridid = x;

                device._id = x;
                rowData.push(device);
            }
            $gridDevices.jqGrid('addRowData', '_id', rowData);
            $gridDevices.trigger('reloadGrid');
            $('button.paramset:not(.ui-button)').button();
        }

        function removeSelectionAfterDblClick() {
            if(document.selection && document.selection.empty) {
                document.selection.empty();
            } else if(window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
            }
        }

        // Resizing
        function resizeGrids() {
            var x = $(window).width();
            var y = $(window).height();
            if (x < 1200) x = 1200;
            if (y < 600) y = 600;

            $('#grid-events').css('height', (y - 84) + 'px').css('width', (x - 18) + 'px');
            $('#grid-events-inner').css('height', (y - 104) + 'px');
        }
        $(window).resize(resizeGrids);

        // Navigation
        window.onhashchange = function () {
            var tmp = window.location.hash.slice(1).split('/');
            hash = tmp[1];
            if (tmp[2]) {
                var index = $('#tabs-main a[href="#' + tmp[2] + '"]').parent().index();
                $tabsMain.tabs("option", "active", index - 2);
            }
        };

        function dialogSetName() {
            var devSelected = $gridDevices.jqGrid('getGridParam','selrow');
            var chGrid = null;

            var address = $('#grid-devices tr#' + devSelected + ' td[aria-describedby="grid-devices_nodeid"]').html();
            var name = $('#grid-devices tr#' + devSelected + ' td[aria-describedby="grid-devices_name"]').html();
            var rowid = devSelected;

            $('#rename-rowid').val(rowid);
            $('#rename-gridid').val(chGrid);
            $('#rename-address').val(address);
            $('#rename-name').val(name == '&nbsp;' ? '' : name);
            $dialogSetName.dialog('open');
        }

        function dialogparamsetValues(parent) {

            var comclass = parent.find('[aria-describedby$="_comclass"]').text();
            var instance = parent.find('[aria-describedby$="_instance"]').text();
            var index = parent.find('[aria-describedby$="_index"]').text();
            var type = parent.find('[aria-describedby$="_type"]').text();
            var value = parent.find('[aria-describedby$="_value"]').text();
            var label = parent.find('[aria-describedby$="_label"]').text();
            var nodeid = parent.find('[aria-describedby$="_nodeid"]').text();
            var genre = parent.find('[aria-describedby$="_genre"]').text();
            var name = parent.find('[aria-describedby$="_name"]').text();

            // TODO: Implement Help Function
            // var help = parent.find('[aria-describedby$="_help"]').text();

            $('#nodeid').val(nodeid);
            $('#label').val(label);
            $('#index').val(index);
            $('#genre').val(genre);
            $('#comclass').val(comclass);
            $('#name').val(name);
            // TODO: Implement Help Function
            // $('#help').val(help);

            var address;
//        address = 'zwave.0.NODE'+nodeid+'.CONFIGURATION.'+label;
            if (genre == "config") {
                address = 'zwave.0.NODE'+nodeid+".CONFIGURATION."+label;
            } else {
                address = 'zwave.0.NODE' + nodeid + "." + label;
            }

            if (type == "list") {
                if (objects['zwave.0.NODE'+nodeid] != undefined) {
                    label = label.replace(/\./g, '_'); //.replace(/ /g, '_');
                    if (genre == "config") {
                        address = 'zwave.0.NODE'+nodeid+".CONFIGURATION."+label;
                    } else {
                        address = 'zwave.0.NODE'+nodeid;

                        for (var o in metadata) {
                            var obj = metadata[o];
                            if (obj._id.search(address) == 0 && obj._id.search(label) > 0) {
                                address = obj._id;
                            }
                        }
                    }
                    var obj = metadata[address];
                    if (obj == undefined) {
                        alert("This Address is not configured :" + address);
                    }
                    var selectObject = '<select id="input-value" name="input-value">';
                    for (var l = 0; l < obj.native.values.length; l++) {
                        var lbl = obj.native.values[l];
                        if (lbl == value) {
                            selectObject += '<option selected=selected value="'+l+'">'+lbl+'</option>';
                        } else {
                            selectObject += '<option value="'+l+'">'+lbl+'</option>';
                        }
                    }
                    $('#input-value').replaceWith(selectObject+'</select>');
                    $('#input-value').select();

                    $dialogparamsetValues.dialog('open');
                } else {
                    alert("object for list not found");
                }
            } else if (type == "byte" || type == "short" || type == "int") {
                $('#input-value').replaceWith('<input type="text" id="input-value" value=""/>');
                $('#input-value').attr('type', 'number');
                $('#input-value').val(value);
                $dialogparamsetValues.dialog('open');
            } else if (type == "button") {
                $('#input-value').replaceWith('<input type="button" id="input-value" value=""/>');
                $('#input-value').button();
                $('#input-value').val(label);
                $('#input-value').on( "click", function() {
                    alert("Not yet implemented");
                });

                $dialogparamsetValues.dialog('open');
            } else if(type == "string") {
                $('#input-value').replaceWith('<input type="text" id="input-value" value=""/>');
                $('#input-value').attr('type', 'text');
                $('#input-value').val(value);
                $dialogparamsetValues.dialog('open');
            } else {
                $('#input-value').replaceWith('<input type="text" id="input-value" value=""/>');
                $('#input-value').attr('type', 'checkbox');
                $('#input-value').val(value);
                $dialogparamsetValues.dialog('open');
            }
            $('#address').val(address);
        }

        function dialogSetLocation() {
            var devSelected = $gridDevices.jqGrid('getGridParam','selrow');
            var chGrid = null;

            var address = $('#grid-devices tr#' + devSelected + ' td[aria-describedby="grid-devices_nodeid"]').html();
            var name = $('#grid-devices tr#' + devSelected + ' td[aria-describedby="grid-devices_location"]').html();
            var rowid = devSelected;

            $('#rename-rowid').val(rowid);
            $('#rename-gridid').val(chGrid);
            $('#rename-address').val(address);
            $('#rename-loc').val(name == '&nbsp;' ? '' : name);
            $dialogSetLocation.dialog('open');
        }

        function rpcAlert(daemon, cmd, params, callback) {
            socket.emit('rpc', daemon, cmd, params, function (err, res) {
                if (err) {
                    alert(daemon + ' ' + cmd + '\n' + JSON.stringify(err));
                } else if (res.faultCode) {
                    alert(daemon + ' ' + cmd + '\n' + JSON.stringify(res));
                }
                if (typeof callback === 'function') callback(err, res);
            });
        }

        function calcName(nodeid, comclass, idx, instance) {
            // TODO: REMOVE HARDCODE zwave.node0
            var name = "zwave.0" + ".NODE" + nodeid;
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

    });
})(jQuery);
