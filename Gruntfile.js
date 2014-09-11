/*
 * Copyright (C) 2014 Opersys inc.
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
                    {  cwd: "bin", dest: "dist/_bin/", src: [ "**" ] }
                ]
            },

            dist: {
                files: [
                    { cwd: ".", dest: "dist/", src:
                        [
                            "app.js",
                            "package.json"
                        ]
                    },
                    { cwd: "./", dest: "dist/", src:
                        [
                            "public/**/*",
                            "routes/*.js",
                            "posix.js",
                            "inotify.js",
                            "unix-access.js",
                            "app.js"
                        ]
                    },
                    { cwd: "./assets/css", dest: "dist/public/css/", src:
                        [
                            "font-awesome.min.css"
                        ]
                    }
                ]
            }
        },

        concat: {
            options: { separator: "\n\n/* ******** */\n\n" },
            dist_css: {
                // Font Awesome is not included since it seems it has to be
                // loaded alone for the web font to be properly loaded in Chrome.
                src: [
                    "assets/css/slick.grid.css",
                    "assets/css/slick-default-theme.css",
                    "assets/css/w2ui-1.4.min.css",
                    "assets/css/style.css",
                    "assets/css/style-jstree.css",
                    "assets/css/dropzone.css"
                ],
                dest: "dist/public/css/<%= pkg.name %>_styles.css"
            },
            dist_libs: {
                // Source files. Order matters.
                src: [
                    "assets/jslib/jquery-2.0.3.min.js",
                    "assets/jslib/jquery.event.drag-2.2.js",
                    "assets/jslib/jquery.timer.js",
                    "assets/jslib/underscore-min.js",
                    "assets/jslib/backbone.js",
                    "assets/jslib/backbone.localStorage-min.js",
                    "assets/jslib/humanize.min.js",
                    "assets/jslib/moment.min.js",
                    "assets/jslib/smoothie.js",
                    "assets/jslib/w2ui-1.4.min.js",
                    "assets/jslib/jstree.min.js",
                    "assets/jslib/jquery-ui.min.js",
                    "assets/jslib/slickgrid/slick.core.js",
                    "assets/jslib/slickgrid/slick.grid.js",
                    "assets/jslib/slickgrid/slick.formatters.js",
                    "assets/jslib/slickgrid/plugins/slick.cellselectionmodel.js",
                    "assets/jslib/slickgrid/plugins/slick.cellrangeselector.js",
                    "assets/jslib/slickgrid/plugins/slick.rowselectionmodel.js",
                    "assets/jslib/dropzone.js"
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
                    "assets/js/model.options.js",
                    "assets/js/model.fs.js",
                    "assets/js/model.events.js",
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
            }
        },

        /*uglify: {
            dist: {
                options: {
                    sourceMap: true
                },
                files: {
                    "dist/public/js/<%= pkg.name %>_libs.min.js": ["<%= concat.dist_libs.dest %>"],
                    "dist/public/js/<%= pkg.name %>_main.min.js": ["<%= concat.dist_main.dest %>"]
                }
            }
        },

        cssmin: {
            dist: {
                src: "<%= concat.dist_css.dest %>",
                dest: "<%= concat.dist_css.dest %>"
            }
        },*/

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

    grunt.registerTask("default", ["mkdir", "copyto", "concat", /*"uglify", "cssmin",*/ "jade", "exec:npm_install"]);
    grunt.registerTask("pack", ["default", "chmod", "compress", "exec:md5sum"]);
}

