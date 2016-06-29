var path = require('path');
var async = require('async');
var qiniu = require('qiniu');
var extract = require('extract-zip');
var http = require('http');
var fs = require('fs');
var del = require('del');
var exec = require('child_process').exec;

var nodeModulesPath = path.join(__dirname, '../../', 'node_modules');
var nodeSassLocalPath = path.join(nodeModulesPath, 'node-sass');
var buildRemotePath = 'http://o92gtaqgp.bkt.clouddn.com/build.js';
var buildLocalPath = path.join(nodeSassLocalPath, 'scripts', 'build.js');

if (process.env.WeFlowBuild) {

    async.series([
        function(next){
            del(buildLocalPath, {force: true}).then(function () {
                console.log('del ' + buildLocalPath + ' success.');
                next();
            });
        },
        function(next){
            downFile(buildLocalPath, buildRemotePath, function () {
                next();
            });
        },
        function(next){
            var opt = {};
            opt.cwd = nodeSassLocalPath;
            console.log(opt);
            runShell('node scripts/build -f', opt, function(){
                console.log('node-sass rebuild success.');
                next();
            });
        }
    ]);
}

function downFile(localFilePath, remoteFilePath, callback) {

    console.log(remoteFilePath + ' downloading...');

    var file = fs.createWriteStream(localFilePath);

    http.get(remoteFilePath, function (response) {
        if (response.statusCode !== 200) {
            callback.apply(this, [true]);
        } else {
            response.pipe(file);
            file.on('finish', function () {
                console.log('Download success: ', localFilePath);
                callback.apply(this, [false]);
            });
        }

    }).on('error', function (err) {
        console.log('Download fail: ', localFilePath, err);
    });
}

function runShell(command, opt, callback) {
    var ls = exec(command, opt, function (err, stdout, stderr) {
        if (err) throw err;
        callback && callback();
    });

    ls.stdout.on('data', function (data) {
        console.log(data);
    });

    ls.stderr.on('data', function (data) {
        console.log(data);
    });

    ls.on('exit', function (code) {
        console.log('child process exited with code ' + code);
    });
}

