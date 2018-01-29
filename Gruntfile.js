/*
 * Copyright (C) 2014-2018, Opersys inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var async = require("async");
var os = require("os");
var fs = require("fs");
var path = require("path");
var got = require("got");
var _ = require("underscore");
var URL = require("url").URL;
var tarball = require("tarball-extract");
var child = require("child_process");

module.exports = function (grunt) {
    var mkdir_config = {},
        copy_config = {},
        prebuilts_config = {},
        exec_config = {},
        concat_config = {},
        pug_config = {};

    grunt.config.init({
        pkg: grunt.file.readJSON("package.json")
    });

    _.each(["arm", "arm64", "ia32", "x86_64"], function (arch) {
        var mkdist = function (arch) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return path.join.apply(this, ["dist_" + arch].concat(args));
            };
        }(arch);

        mkdir_config["dist_" + arch] = {
            options: {
                create: [
                    mkdist("_bin"),
                    mkdist("public", "css"),
                    mkdist("public", "js"),
                    mkdist("public", "routes"),
                    mkdist("public", "views"),
                    "prebuilt_" + arch,
                    "out"
                ]
            }
        };

        concat_config["dist_concat_libs_" + arch] = {
            // Source files. Order matters.
            src: [
                "external/jquery/jquery-2.0.3.min.js",
                "external/jquery.event.drag/jquery.event.drag-2.2.js",
                "external/jquery.timer/jquery.timer.js",
                "external/underscore/underscore-min.js",
                "external/backbone/backbone.js",
                "external/backbone.localstorage/backbone.localStorage-min.js",
                "external/humanize/humanize.min.js",
                "external/moment/moment.min.js",
                "external/w2ui/w2ui-1.4.min.js",
                "external/jstree/jstree.min.js",
                /* SlickGrid requires this but this is not the complete
                   JQuery UI distribution. Just the bare minimum was included. */
                "external/jquery-ui/jquery-ui.min.js",
                "external/slickgrid/slick.core.js",
                "external/slickgrid/slick.editors.js",
                "external/slickgrid/slick.grid.js",
                "external/slickgrid/slick.formatters.js",
                "external/slickgrid/plugins/slick.cellselectionmodel.js",
                "external/slickgrid/plugins/slick.cellrangeselector.js",
                "external/slickgrid/plugins/slick.rowselectionmodel.js",
                "external/jquery.cookie/jquery.cookie.js",
                "external/dropzone/dropzone.js",
                "external/opentip/opentip-jquery.min.js"
            ],
            dest: mkdist("/public/js/<%= pkg.name %>_libs.js")
        };

        concat_config["dist_concat_css_" + arch] = {
            // Font Awesome is not included since it seems it has to be
            // loaded alone for the web font to be properly loaded in Chrome.
            src: [
                "external/slickgrid/slick.grid.css",
                "external/slickgrid/slick-default-theme.css",
                "external/opentip/opentip.css",
                "external/w2ui/w2ui-1.4.min.css",
                "assets/css/style.css",
                "external/jstree/style-jstree.css",
                "external/dropzone/dropzone.css"
            ],
            dest: mkdist("public/css/<%= pkg.name %>_styles.css")
        };

        concat_config["dist_concat_main_" + arch] = {
            options: {
                process: function(src, filepath) {
                    return '//####' + filepath + '\n' + src;
                },
                nonull: true
            },
            src: [
                "assets/js/backbone.slickeditor.js",
                "assets/js/model.options.js",
                "assets/js/model.fs.js",
                "assets/js/model.events.js",
                "assets/js/popup.view.confirm.js",
                "assets/js/popup.view.message.js",
                "assets/js/popup.view.delete.js",
                "assets/js/popup.view.rename.js",
                "assets/js/popup.view.errormsg.js",
                "assets/js/popup.view.stopped.js",
                "assets/js/overlay.view.columns.js",
                "assets/js/overlay.view.options.js",
                "assets/js/overlay.view.errors.js",
                "assets/js/overlay.view.upload.js",
                "assets/js/view.upload.js",
                "assets/js/view.dirtree.js",
                "assets/js/view.filelist.js",
                "assets/js/view.filesystem.js",
                "assets/js/view.main.js",
                "assets/js/view.events.js",
                "assets/js/view.files.js",
                "assets/js/fs.js"
            ],
            dest: mkdist("/public/js/<%= pkg.name %>_main.js")
        };

        copy_config["dist_" + arch] = {
            files: [
                {cwd: "./public",
                    dest: mkdist("public/"),
                    src: ["**"],
                    expand: true},
                {cwd: ".",
                    dest: mkdist("/"),
                    src: ["app.js", "package.json"],
                    expand: true},
                {cwd: ".",
                    dest: mkdist("/"),
                    src: ["routes/*.js"]},
                {cwd: "./assets/css/",
                    dest: mkdist("public/css"),
                    src: ["font-awesome.min.css"],
                    expand: true},
                {src: ["external/FontAwesome/font-awesome.min.css"],
                    dest: mkdist("public/css/font-awesome.min.css")},
                {src: ["external/modernizr/modernizr.custom.60782.js"],
                    dest: mkdist("public/js/modernizr.js")},
                {cwd: "external/FontAwesome",
                    src: ["*.otf", "*.eot", "*.svg", "*.ttf", "*.woff"],
                    dest: mkdist("public/font"),
                    expand: true}
            ]
        };

        exec_config["dist_npm_" + arch] = {
            command: function () {
                return "npm --production --no-optional --prefix=" + mkdist("/") + " install";
            }
        };

        pug_config["dist_" + arch] = {
            expand: true,
            files: {},
            src: ["*.pug"],
            ext: ".html",
            cwd: "views",
            dest: mkdist("public")
        };

        prebuilts_config["dist_" + arch] = _.map(grunt.config("pkg.prebuilts.modules." + arch), function (v) {
            return {
                url: v,
                arch: arch
            };
        });

        grunt.registerTask("dist_" + arch, [
            "mkdir:dist_" + arch,
            "copy:dist_" + arch,
            "concat:dist_concat_css_" + arch,
            "concat:dist_concat_libs_" + arch,
            "concat:dist_concat_main_" + arch,
            "pug:dist_" + arch,
            "exec:dist_npm_" + arch,
            "prebuilts:dist_" + arch
        ]);
    });

    grunt.config("mkdir", mkdir_config);
    grunt.config("copy", copy_config);
    grunt.config("exec", exec_config);
    grunt.config("prebuilts", prebuilts_config);
    grunt.config("concat", concat_config);
    grunt.config("pug", pug_config);

    function extract(arch, dlfile, doneCb) {
        var exdest = path.join("dist_" + arch, "node_modules");
        tarball.extractTarball(dlfile, exdest, doneCb);
    }

    function downloadAndExtract(arch, dataUrl, doneCb) {
        var url = new URL(dataUrl);
        var dlfile = path.basename(url.pathname);
        var dldest = path.join("prebuilt_" + arch , dlfile);

        fs.exists(dldest, function (exists) {
            if (!exists) {
                var dlstream = got.stream(url.toString());

                dlstream.on("end", function () {
                    extract(arch, dldest, doneCb);
                });
                dlstream.pipe(fs.createWriteStream(dldest));
            }
            else extract(arch, dldest, doneCb);
        });
    }

    grunt.registerMultiTask("prebuilts", "Download a prebuilt package from an URL", function () {
        var data = this.data;
        var done = this.async();

        async.each(data,
            function (dldata, callback) {
                downloadAndExtract(dldata.arch, dldata.url, callback);
            }, done
         );
    });

    grunt.loadNpmTasks("grunt-mkdir");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-pug");

    grunt.registerTask("arm64", ["dist_arm64"]);
    grunt.registerTask("arm", ["dist_arm"]);
    grunt.registerTask("ia32", ["dist_ia32"]);
    grunt.registerTask("x86_64", ["dist_x86_64"]);
};


