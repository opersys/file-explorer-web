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

var FileSystemView = Backbone.View.extend({

    initialize: function (opts) {
        var self = this;

        // Initialize the collections.
        self._options = opts.options;

        // Initialize the internal layout
        self.$el.w2layout({
            name: "fs_view_layout",
            padding: 4,
            panels: [
                {
                    type: "left",
                    size: 300,
                    resizable: true
                },
                {
                    type: "main",
                    resizer: 5,
                    resizable: true
                }
            ]
        });

        self._dirTree = new DirTreeView({
            el: w2ui["fs_view_layout"].el("left"),
            options: self._options
        });

        self._filesView = new FilesView({
            el: w2ui["fs_view_layout"].el("main"),
            options: self._options
        });

        self._dirTree.on("dirtreeview:ondirectoryselected", function (path) {
            self._filesView.openDirectory({
                directory: path
            });
        }, self);
    },

    resize: function () {
        w2ui["fs_view_layout"].resize();
    }
});