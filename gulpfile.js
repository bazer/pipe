"use strict";
var gulp = require('gulp');
var ts = require('gulp-typescript');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
// var merge = require('merge2');

var tsProject = ts.createProject('tsconfig.json', { outDir: "./bin" });

function build() {
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: './' }))
        .pipe(gulp.dest('bin'));
};

// var distProject = ts.createProject('tsconfig.json', { outDir: "./dist", outFile: "pipe.js", module: "amd", });

// function dist() {
//     return distProject.src()
//         .pipe(distProject())
//         .pipe(gulp.dest('dist'));
// }

function clean(cb) {
    del(['bin', 'dist']);
    cb();
}

function watch() {
    return gulp.watch(['src/**/*.ts', 'tests/**/*.ts'], gulp.series(build));
}

exports.clean = clean;
exports.build = build;
// exports.dist = gulp.series(clean, dist);
exports.watch = watch;
exports.default = gulp.series(clean, build);
