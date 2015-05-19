/*
 * Copyright (C) 2014-2015, Opersys inc.
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

var os = require("os");
var fs = require("fs");
var path = require("path");
var _ = require("underscore");

module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        css_crunch: {
            dist: {
                src: "assets/css/",
                dest: "dist/public/css/<%= pkg.name %>_styles.css",
                minify: true,
                optimize: true,
                copy: true
            }
        },

        mkdir: {
            dist: {
                options: {
                    create: [
                        "dist/_bin/",
                        "dist/public/css",
                        "dist/public/js",
                        "dist/routes",
                        "dist/views",
                        "out"
                    ]
                }
            }
        },

        copyto: {
            bins: {
                files: [
                    {  cwd: "./bin/", dest: "dist/_bin/", src: [ "**" ], expand: true }
                ]
            },

            dist: {
                files: [
                    { cwd: ".", dest: "dist/", src:
                        [
                            "app.js",
                            "package.json"
                        ],
                        expand: true
                    },
                    { cwd: ".", dest: "dist/", src:
                        [
                            "public/**/*",
                            "routes/*.js",
                            "posix.js",
                            "inotify.js",
                            "unix-access.js",
                            "abstract-socket.js",
                            "app.js"
                        ],
                        expand: true
                    },
                    { cwd: "./assets/css/", dest: "dist/public/css/", src:
                        [
                            "font-awesome.min.css"
                        ],
                        expand: true
                    }
                ]
            },
            external: {
                files: [
                    // FontAwesome
                    { src: [ "external/FontAwesome/font-awesome.min.css" ], dest: "dist/public/css/font-awesome.min.css" },
                    { expand: true,
                        cwd: "external/FontAwesome",
                        src: ["*.otf", "*.eot", "*.svg", "*.ttf", "*.woff"],
                        dest: "dist/public/font" }
                ]
            }
        },

        concat: {
            options: { separator: "\n\n/* ******** */\n\n" },
            dist_css: {
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
                dest: "dist/public/css/<%= pkg.name %>_styles.css"
            },
            dist_libs: {
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
                dest: "dist/public/js/<%= pkg.name %>_libs.js"
            },
            dist_main: {
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
                dest: "dist/public/js/<%= pkg.name %>_main.js"
            },
            dist_login: {
                options: {
                    process: function(src, filepath) {
                        return '//####' + filepath + '\n' + src;
                    },
                    nonull: true
                },
                src: [
                    "assets/js/login.js"
                ],
                dest: "dist/public/js/<%= pkg.name %>_login.js"
            }
        },

        exec: {
            npm_install: {
                command: "npm --production install",
                stdout: false,
                stderr: false,
                cwd: "dist"
            },
            md5sum: {
                command: "md5sum out/file-explorer.zip | cut -f 1 -d ' ' > out/file-explorer.zip.md5sum"
            }
        },

        jade: {
            html: {
                src: ["views/*.jade"],
                dest: "dist/public/",
                options: {
                    client: false
                }
            }
        },

        chmod: {
            options: {
                mode: "755"
            },
            node: {
                src: ["dist/node"]
            }
        },

        compress: {
            dist: {
                options: {
                    archive: "out/file-explorer.zip",
                    mode: 0
                },
                files: [
                    { expand: true, cwd: "./dist", src: ["./**"] }
                ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-mkdir");
    grunt.loadNpmTasks("grunt-css");
    grunt.loadNpmTasks("grunt-copy-to");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-jade");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-pack");
    grunt.loadNpmTasks("grunt-chmod");

    grunt.registerTask("dev_bin", "Pick the right binaries for development", function (arch) {
        var selArch, defArch = os.arch();

        if (!arch)
            selArch = defArch;
        else
            selArch = arch;

        var files = fs.readdirSync("./dist/_bin");
        var r = new RegExp(selArch + "$");

        _.each(files, function (file) {
            var f = path.join("./dist/_bin", file);
            var e = new RegExp("\\.{0,1}_{0,1}" + selArch);

            if (r.test(file)) {
                grunt.file.copy(f, "./dist/" + file.replace(e, ""));
                grunt.log.writeln("Using " + file);
            }
        });
    });

    grunt.registerTask("default", ["mkdir", "copyto", "concat", /*"uglify", "cssmin",*/ "jade", "exec:npm_install"]);
    grunt.registerTask("dev", ["default", "dev_bin"]);
    grunt.registerTask("pack", ["default", "chmod", "compress", "exec:md5sum"]);
}

