"use strict";
const path = require('path');
const http = require('http');
const fs = require('fs');

const BINDING = 'binding.node';
const DIRNAME = `${process.platform}-${process.arch}-${process.versions.modules}`;
const HOST = 'http://o92gtaqgp.bkt.clouddn.com'

let weflowPath = path.join(__dirname, '../');
let nodeModulesPath = path.join(weflowPath, 'node_modules');
let nodeSassLocalPath = path.join(nodeModulesPath, 'node-sass', 'vendor', DIRNAME, BINDING);
let nodeSassRemotePath = `${HOST}/${process.platform}-${process.arch}-${process.versions.modules}/${BINDING}`;


downFile(nodeSassLocalPath, nodeSassRemotePath, function (err) {
    if(err){
        throw new Error(err);
    }
    console.log('Download success: ', nodeSassLocalPath);
});


function downFile(localFilePath, remoteFilePath, callback) {

    console.log(remoteFilePath + ' downloading...');

    let file = fs.createWriteStream(localFilePath);

    http.get(remoteFilePath, function (response) {
        if (response.statusCode !== 200) {
            callback.apply(this, [true]);
        } else {
            response.pipe(file);
            file.on('finish', function () {
                callback.apply(this, [false, 0]);
            });
        }

    }).on('error', function (err) {
        console.log('Download fail: ', localFilePath, err);
    });
}
