/**
 *      openzwave-configurator
 *
 *  Copyright (c) 2015 husky-koglhof
 *
 *  CC BY-NC-SA 4.0 (http://creativecommons.org/licenses/by-nc-sa/4.0/)
 *
 */

"use strict";

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
            },
            gridComplete: function () {
            }
        }).navGrid('#pager-devices', {
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-devices', {
            caption: '',
            buttonicon: 'ui-icon-pencil',
            onClickButton: dialogSetName,
            position: 'first',
            id: 'setName',
            title: _('Set Name'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-devices', {
            caption: '',
            buttonicon: 'ui-icon-image',
            onClickButton: dialogSetLocation,
            position: 'first',
            id: 'setLocation',
            title: _('Set Location'),
            cursor: 'pointer'
            /*
             // TODO: ADD SUPPORT FOR THIS FUNCTIONS
        }).jqGrid('navButtonAdd', '#pager-devices', {
            caption: '',
            buttonicon: 'ui-icon-gear',
            onClickButton: dialogparamsetValues,
            position: 'first',
            id: 'setValues',
            title: _('Change Parameter(s)'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-devices', {
            caption: '',
            buttonicon: 'ui-icon-newwin',
            onClickButton: getDevices,
            position: 'first',
            id: 'setGroup',
            title: _('Set Group'),
            cursor: 'pointer'
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
            buttonicon: 'ui-icon-plus',
            onClickButton: getDevices,
            position: 'first',
            id: 'addDevice',
            title: _('Add Device'),
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

        function subGridChannels(grid_id, row_id) {
            var subgrid_table_id = 'channels_' + row_id + '_t';
            $('#' + grid_id).html('<table id="' + subgrid_table_id + '"></table>');
            var gridConf = {
                datatype: 'local',
            // TODO: Implement Help Function
            colNames: ['Comclass', 'Genre', 'Index', 'Instance', 'Label', 'Min', 'Max', 'Read Only', 'Write Only', 'Type', 'Units', 'Value', 'Node Id', /*'Help'*/],
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
                    var gridid = "jqg" + listDevices[i].gridid;
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
                                    device.read_only = clz.read_only;
                                    device.type = clz.type;
                                    device.units = clz.units;
                                    device.value = clz.value;
                                    device.write_only = clz.write_only;
                                    // TODO: Implement Help Function
                                    // device.help = clz.help;

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

                if (read_only.search("false") == 0) {
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

                        if (genre == "config") {
                            servConn._socket.emit('setState', address, {
                                val: {nodeid:nodeid, action:"changeConfig", paramId: index, paramValue: val, label: label, index: index, comclass: comclass},
                                ack: true
                            }, function (res, err) {
                                console.log("result: " + res);
                                console.log("error: " + err);

                                $that.dialog('close');
                            });
                        } else if (genre == "system") {
                            servConn._socket.emit('setState', address, {
                                val: {nodeid:nodeid, action:"changeSystem", paramId: index, paramValue: val, label: label},
                                ack: true
                            }, function (res, err) {
                                console.log("result: " + res);
                                console.log("error: " + err);

                                $that.dialog('close');
                            });
                        }
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
        $gridDevices.jqGrid('clearGridData');
        var rowData = [];
        var device;
        //for (var i = 0, len = listDevices.length; i < len; i++) {
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

            rowData.push(device);
        }
        $gridDevices.jqGrid('addRowData', '_id', rowData);
        $gridDevices.trigger('reloadGrid');
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
        // TODO: Implement Help Function
        // var help = parent.find('[aria-describedby$="_help"]').text();

        $('#nodeid').val(nodeid);
        $('#label').val(label);
        $('#index').val(index);
        $('#genre').val(genre);
        $('#comclass').val(comclass);
        // TODO: Implement Help Function
        // $('#help').val(help);

        if (type == "list") {
            if (objects['zwave.0.NODE'+nodeid] != undefined) {
                var address;
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
                $('#address').val(address);
                var obj = metadata[address];
                if (obj == undefined) {
                    alert("This Address is not configured :" + address);
                }
                var selectObject = '<select id="input-value" name="input-value">';
                for (var l = 0; l < obj.native.values.length; l++) {
                    var lbl = obj.native.values[l];
                    if (lbl == value) {
                        selectObject += '<option selected=selected value="'+lbl+'">'+lbl+'</option>';
                    } else {
                        selectObject += '<option value="'+lbl+'">'+lbl+'</option>';
                    }
                }
                $('#input-value').replaceWith(selectObject+'</select>');
                $('#input-value').select();

                $dialogparamsetValues.dialog('open');
            } else {
                alert("object for list not found");
            }
        } else if (type == "byte" || type == "short") {
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
});
})(jQuery);
