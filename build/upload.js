"use strict";

const path = require('path');
const async = require('async');
const qiniu = require('qiniu');
const extract = require('extract-zip');
const http = require('http');
const fs = require('fs');
const del = require('del');
const gulp = require('gulp');
const zip = require('gulp-zip');
const config = require('rc')('qiniu');

let weflowPath = path.join(__dirname, '../');
let srcAll = path.join(weflowPath, 'dist', '**/*');
let pkg = require(path.join(weflowPath, 'package.json'));
let distName = `WeFlow-${pkg.version}-${process.platform}-${process.arch}.zip`;

async.series([
    function (next) {
        gulp.src(srcAll)
            .pipe(zip(distName))
            .pipe(gulp.dest(weflowPath))
            .on('end', function () {
                console.log('zip success.');
                next();
            });
    },
    function (next) {
        //准备上传
        qiniu.conf.ACCESS_KEY = config['ACCESS_KEY'];
        qiniu.conf.SECRET_KEY = config['SECRET_KEY'];

        var uptoken = new qiniu.rs.PutPolicy('weflow' + ":" + distName).token();
        var zipPath = path.join(weflowPath, distName);

        uploadFile(uptoken, distName, zipPath, function (ret) {
            console.log(ret.key + ' upload success.');
            next();
        });
    }
]);

function uploadFile(token, key, filePath, callback) {

    var extra = new qiniu.io.PutExtra();

    qiniu.io.putFile(token, key, filePath, extra, function (err, ret) {

        if (err) {
            console.log(err);
        }

        callback && callback(ret);

    });
}

