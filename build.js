var path = require('path');
var qiniu = require('qiniu');
var extract = require('extract-zip');
var http = require('http');
var fs = require('fs');

var nodeModulesPath = path.join(__dirname, 'node_modules');
var nodeSassLocalPath = path.join(nodeModulesPath, 'node-sass.zip');
var nodeSassRemotePath = 'http://o92gtaqgp.bkt.clouddn.com/node-sass.zip';

if (!process.env.WeFlowBuild) {
    downFile(nodeSassLocalPath, nodeSassRemotePath, function () {
        extract(nodeSassLocalPath, {dir: nodeModulesPath}, function (err) {
            console.log('extract success.');
        });
    });
}

function downFile(localFilePath, remoteFilePath, callback) {

    console.log(remoteFilePath + 'downloading...');

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

