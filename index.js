var logEvent = function(name, data) {
	console.log('#logEvent,%s,%s', name, JSON.stringify(data, null, 0));
};
logEvent('lambdaInit', {"time": +new Date()});

// Dependencies
var fs = require('fs');
var procfs = require('procfs-stats');

// Cold start detection
var soSoCold = 1;

var readIdFileSync = function(filename) {
    try {
        return (fs.readFileSync(filename, {encoding: 'utf8'}) || '').trim();
    } catch (e) {
        return null;
    }
};

var parseUptime

exports.handler = (event, context, callback) => {
    // Great background reading: http://0pointer.de/blog/projects/ids.html
    var bootId = readIdFileSync('/proc/sys/kernel/random/boot_id');
    var hostname = readIdFileSync('/proc/sys/kernel/hostname');
    var machineId = readIdFileSync('/var/lib/dbus/machine-id');
    var sessionId = readIdFileSync('/proc/1/sessionid');
    var uptime = (readIdFileSync('/proc/uptime') || '').split(' ');

    procfs.meminfo(function(err,info){
        if (err) {
            console.error('could not get meminfo: ', err);
            return callback(err, null);
        }
        logEvent('lambdaMemory', {
            memTotal: parseInt(info.MemTotal, 10),
            memFree: parseInt(info.MemFree, 10),
            memAvail: parseInt(info.MemAvailable, 10),
            uptime: parseInt(uptime[0], 10),
            idleTime: parseInt(uptime[1], 10),
            coldStart: soSoCold,
            awsRequestId: context.awsRequestId,
            bootId: bootId, 
            hostname: hostname, 
            machineId: machineId,
            sessionId: sessionId
        });

        // reset cold start
        if (soSoCold === 1) {
            soSoCold = 0;
        }
        callback(null, info);
    });
};
