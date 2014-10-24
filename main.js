/**
 *      CCU.IO Z-Wave Adapter 0.0.1
 *
 */

process.exit();


var adapterSettings = settings.adapters.zwave.settings,
    io = require('socket.io-client'),
    fs = require("fs"),
    cp = require('child_process'),
    OZW = require('openzwave');

var ScanComplete = 0;
var OpenZWave = require('../../node_modules/openzwave/lib/openzwave.js');

var zwave = new OZW('/dev/ttyACM0', {
    logging: true,           // enable logging to OZW_Log.txt
    consoleoutput: true,     // copy logging to the console
    saveconfig: true,        // write an XML network layout
    driverattempts: 3,        // try this many times before giving up
    pollinterval: 500,        // interval between polls in milliseconds
    suppressrefresh: false    // do not send updates if nothing changed
});

var nodes = [];

if (settings.ioListenPort) {
    var socket = io.connect(settings.binrpc.listenIp, {
        port: settings.ioListenPort
    });
} else if (settings.ioListenPortSsl) {
    var socket = io.connect(settings.binrpc.listenIp, {
        port: settings.ioListenPortSsl,
        secure: true
    });
} else {
    process.exit();
}

zwave.on('driver ready', function (homeid) {
    console.log('scanning homeid=0x%s...', homeid.toString(16));
});

zwave.on('driver failed', function () {
    console.log('failed to start driver');
    zwave.disconnect();
    process.exit();
});

zwave.on('node added', function (nodeid) {
    nodes[nodeid] = {
        manufacturer: '',
        manufacturerid: '',
        product: '',
        producttype: '',
        productid: '',
        type: '',
        name: '',
        loc: '',
        classes: {},
        ready: false
    };
});

socket.on('event', function (obj) {
    if (!obj || !obj[0]) {
        return;
    }
    var id = obj[0];

    var val = obj[1];
    var mask = 0xff;

    var nodeid = mask & (id - settings.adapters.zwave.firstId)>>> 16;
    var comclass = mask & (id - settings.adapters.zwave.firstId)>>> 8;
    var idx = mask & (id - settings.adapters.zwave.firstId);

    if (ScanComplete){
        zwave.setLevel(nodeid, val);
       // zwave.setValue(nodeid, idx,  val);
        //console.log(JSON.stringify(nodes[nodeid]));
        console.log('Event nodeid=%d: comclass=%d: index=%d: value=%d', nodeid, comclass, idx, val);
    }
});

zwave.on('value added', function (nodeid, comclass, value) {
    if (!nodes[nodeid]['classes'][comclass])
        nodes[nodeid]['classes'][comclass] = {};
    nodes[nodeid]['classes'][comclass][value.index] = value;
    var idx = value['index'];
    socket.emit("setState", [settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)), value['value']]);
    //console.log('idx%d: comclass%d: nodeid%d', idx, comclass, nodeid);
   // console.log('ValueAdded=%s: ID=%d', adapterSettings.deviceName+".NODE"+nodeid+".CLASSES"+comclass, settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)));

});

zwave.on('value changed', function (nodeid, comclass, value) {
    if (nodes[nodeid]['ready']) {
        var idx = value['index'];
        console.log('node%d: changed: %d:%s:%s->%s: index=%d: date=%s', nodeid, comclass,
            value['label'],
            nodes[nodeid]['classes'][comclass][value.index]['value'],
            value['value'], idx, getDateTime());

       // var idd = idx + 1;
        socket.emit("setState", [settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)), value['value']]);
       // console.log('idx%d: comclass%d: nodeid%d', idx, comclass, nodeid);
       console.log('ValueChanged=%s: ID=%d', adapterSettings.deviceName + ".NODE" + nodeid + ".CLASSES" + comclass, settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)));
    }
    nodes[nodeid]['classes'][comclass][value.index] = value;
});

zwave.on('value removed', function (nodeid, comclass, index) {
    if (nodes[nodeid]['classes'][comclass] &&
        nodes[nodeid]['classes'][comclass][index])
        delete nodes[nodeid]['classes'][comclass][index];
});

zwave.on('node ready', function (nodeid, nodeinfo) {
    nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
    nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
    nodes[nodeid]['product'] = nodeinfo.product;
    nodes[nodeid]['producttype'] = nodeinfo.producttype;
    nodes[nodeid]['productid'] = nodeinfo.productid;
    nodes[nodeid]['type'] = nodeinfo.type;
    nodes[nodeid]['name'] = nodeinfo.name;
    nodes[nodeid]['loc'] = nodeinfo.loc;
    nodes[nodeid]['ready'] = true;
    //console.log(JSON.stringify(nodes[nodeid]));

    socket.emit("setObject", settings.adapters.zwave.firstId, {
        Name: adapterSettings.deviceName,
        TypeName: "DEVICE",
        HssType: "Z-Wave",
        Address: adapterSettings.deviceName,
        Interface: "CCU.IO",
 //       Channels: [
   //         settings.adapters.zwave.firstId + 1
    //    ],
        _persistent: true
    });



    console.log('node%d: %s, %s', nodeid,
        nodeinfo.manufacturer ? nodeinfo.manufacturer
            : 'id=' + nodeinfo.manufacturerid,
        nodeinfo.product ? nodeinfo.product
            : 'product=' + nodeinfo.productid +
            ', type=' + nodeinfo.producttype);
    console.log('node%d: name="%s", type="%s", location="%s"', nodeid,
        nodeinfo.name,
        nodeinfo.type,
        nodeinfo.loc);

   var combined = (nodeid << 16);
    socket.emit("setObject", settings.adapters.zwave.firstId + combined, {
        Name: adapterSettings.deviceName+".NODE"+nodeid,
        TypeName: "CHANNEL",
        Address: adapterSettings.deviceName+".NODE"+nodeid,
        HssType: "ZWAVE-NODE",
        Parent: settings.adapters.zwave.firstId,
        _persistent: true
    });

    for (comclass in nodes[nodeid]['classes']) {

/*        socket.emit("setObject", (settings.adapters.zwave.firstId+((comclass << 8) | (nodeid << 16))), {
            Name: adapterSettings.deviceName+".NODE"+nodeid+".CLASSES"+comclass,
            TypeName: "CHANNEL",
            Address: adapterSettings.deviceName+".NODE"+nodeid+".CLASSES"+comclass,
            HssType: "ZWAVE-NODE",
            Parent: settings.adapters.zwave.firstId+(nodeid << 16),
            _persistent: true
        });
        console.log('comclass%d: nodeid%d', comclass, nodeid);
        console.log('Emmited=%s: ID=%d', adapterSettings.deviceName+".NODE"+nodeid+".CLASSES"+comclass, settings.adapters.zwave.firstId+((comclass << 8) | (nodeid << 16)));*/
        switch (comclass) {
            case 0x25: // COMMAND_CLASS_SWITCH_BINARY
            case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
                zwave.enablePoll(nodeid, comclass);
                break;
        }

        var values = nodes[nodeid]['classes'][comclass];
      //  console.log('node%d: class %d', nodeid, comclass);
        //console.log(JSON.stringify(values));

        for (idx in values){
      // var idd = idx + 1;

            socket.emit("setObject", settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)), {
                "Name": adapterSettings.deviceName + ".NODE" + nodeid + ".CLASSES" + comclass + "." + values[idx]['label'],
                "TypeName": "HSSDP",
                "Operations": 5,
                "ValueType": 4,
                "ValueUnit": values[idx]['units'],
                "Parent": settings.adapters.zwave.firstId+(nodeid << 16),
                _persistent: true
            });
            //console.log('idx%d: comclass%d: nodeid%d', idx, comclass, nodeid);
            //console.log('Emmited=%s: ID=%d', adapterSettings.deviceName+".NODE"+nodeid+".CLASSES"+comclass+"."+values[idx]['label'], settings.adapters.zwave.firstId+((idx) | (comclass << 8) | (nodeid << 16)));
           //console.log('node%d: %s=%s: date=%s', nodeid, values[idx]['label'], values[idx]['value'], getDateTime() );
        }
    }
});

zwave.on('notification', function (nodeid, notif) {
    switch (notif) {
        case 0:
            console.log('node%d: message complete', nodeid);
            break;
        case 1:
            console.log('node%d: timeout', nodeid);
            break;
        case 2:
            console.log('node%d: nop', nodeid);
            break;
        case 3:
            console.log('node%d: node awake', nodeid);
            break;
        case 4:
            console.log('node%d: node sleep', nodeid);
            break;
        case 5:
            console.log('node%d: node dead', nodeid);
            break;
        case 6:
            console.log('node%d: node alive', nodeid);
            break;
    }
});

zwave.on('scan complete', function () {
    ScanComplete = 1;
    console.log('scan complete, hit ^C to finish.');

});

zwave.connect();

socket.on('connect', function () {
    log("info", "connected to ccu.io");
});

socket.on('disconnect', function () {
    log("info", "disconnected from ccu.io");
});



function stop() {
    zwave.disconnect();
    log("info", "terminating");
    setTimeout(function () {
        process.exit();
    }, 250);
}

process.on('SIGINT', function () {
    stop();
});

process.on('SIGTERM', function () {
    stop();
});
function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

}
function log(sev, msg) {
    socket.emit("log", sev, "adapter zwave   " + (adapterSettings.deviceName ? "(" + adapterSettings.deviceName + ") " : "") + msg);
}             
