var path = require('path');
var async = require('async');
var qiniu = require('qiniu');
var extract = require('extract-zip');
var http = require('http');
var fs = require('fs');
var del = require('del');
var gulp = require('gulp');
var zip = require('gulp-zip');
var config = require('rc')('qiniu');
var exec = require('child_process').exec;

var weflowPath = path.join(__dirname, '../../');
var pkg = require(path.join(weflowPath, 'package.json'));
var srcAll = path.join(weflowPath, 'dist', '**/*');
var nodeModulesPath = path.join(weflowPath, 'node_modules');
var nodeSassLocalPath = path.join(nodeModulesPath, 'node-sass');
var buildRemotePath = 'http://o92gtaqgp.bkt.clouddn.com/build.js';
var buildLocalPath = path.join(nodeSassLocalPath, 'scripts', 'build.js');
var distName = 'WeFlow-' + pkg.version + '-win32-' + process.arch + '.zip';
var runScripts = process.arch === 'x64' ? 'npm run build:win64' : 'npm run build:win32';


var gulpSass = path.join(weflowPath, 'dist', 'WeFlow-win32-ia32', 'resources', 'app', 'node_modules', 'gulp-sass');
var srcgulp = path.join(gulpSass, '**/*');
console.log(srcgulp);

var dirExist = function (dirPath) {
    try {
        var stat = fs.statSync(dirPath);
        if (stat.isDirectory()) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            return false;
        } else {
            throw new Error(err);
        }
    }
}

if (process.env.WeFlowBuild) {

    async.series([
        function (next) {
            del(buildLocalPath, {force: true}).then(function () {
                console.log('del ' + buildLocalPath + ' success.');
                console.log(dirExist(gulpSass))
                next();
            });
        },
        function (next) {
            downFile(buildLocalPath, buildRemotePath, function () {
                console.log(dirExist(gulpSass))
                next();
            });
        },
        function (next) {
            var opt = {};
            opt.cwd = nodeSassLocalPath;
            console.log(opt);
            runShell('node scripts/build -f', opt, function () {
                console.log('node-sass rebuild success.');
                console.log(dirExist(gulpSass))
                next();
            });
        },
        function(next){
            var opt = {};
            opt.cwd = weflowPath;
            console.log(opt);
            runShell(runScripts, opt, function () {
                console.log('build success.');
                console.log(dirExist(gulpSass))
                next();
            });
        },
        function (next) {
            gulp.src(srcgulp)
                .pipe(zip(distName))
                .pipe(gulp.dest(weflowPath))
                .on('end', function () {
                    console.log('zip success.');
                    console.log(dirExist(gulpSass))
                    next();
                });
        },
        function (next) {
            //准备上传
            qiniu.conf.ACCESS_KEY = config['ACCESS_KEY'];
            qiniu.conf.SECRET_KEY = config['SECRET_KEY'];

            var uptoken = new qiniu.rs.PutPolicy('weflow' + ":" + distName).token();
            var zipPath = path.join(weflowPath, distName);

            uploadFile(uptoken, distName, zipPath, function(ret){
                console.log(ret.key + ' upload success.');
                console.log(dirExist(gulpSass))
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

function uploadFile(token, key, filePath, callback) {

    var extra = new qiniu.io.PutExtra();

    qiniu.io.putFile(token, key, filePath, extra, function (err, ret) {

        if(err){
            console.log(err);
        }

        callback && callback(ret);

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

