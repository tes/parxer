'use strict';
var parxer = require('..').parxer;
var async = require('async');
var fs = require('fs');
var input = fs.readFileSync(__dirname + '/large-document.html').toString();
var urlPlugin = require('../Plugins').Url(function (fragment, next) {
  next(null, fragment.attribs['cx-url']);
});
var count = 0;
async.whilst(function () {
    return count < 100000;
}, function(callback) {
    count++;
    parxer({
        plugins: [
            urlPlugin
        ],
        variables: {
            'server:name': 'http://www.google.com',
            'params:resourceId': (Math.random() * (4000000) + 6000000)
        }
    }, input, function() {
        setTimeout(callback, 5);
    });
}, function() {
    console.log('Soak test complete!');
    process.exit();
});

function bytesToSize(bytes) {
    return Math.round(bytes / Math.pow(1024, 2), 2);
}
fs.writeFileSync('soak/memory.csv', 'rss,total,used,change,count' + '\n');
var previousHeap = 0;

function memoryPerSecond() {
    var mem = process.memoryUsage();
    var variance = mem.heapUsed - previousHeap;
    if (variance < 0) {
        variance = '-' + bytesToSize(-variance);
    } else {
        variance = bytesToSize(variance);
    }
    var data = [bytesToSize(mem.rss), bytesToSize(mem.heapTotal), bytesToSize(mem.heapUsed), variance, count].join(',');
    fs.appendFileSync('soak/memory.csv', data + '\n');
    previousHeap = mem.heapUsed;
    setTimeout(memoryPerSecond, 1000);
}
memoryPerSecond();
