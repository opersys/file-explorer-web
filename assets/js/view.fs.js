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

    _txtPathId: _.uniqueId("fileSystemView"),
    _currentErrors: [],

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
                    resizable: true,
                    toolbar: [
                        { type: "html",  id: "txtPath",
                            html: "<div style='padding: 3px 10px;'>" +
                                  "Path: " +
                                  "<input size='100' id='" + self._txtPathId + "'" +
                                  "       style='padding: 3px; border-radius: 2px; border: 1px solid silver' />" +
                                  "</div>"
                        }
                    ]
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
            // Clear the errors
            this._currentErrors = [];

            // Open the new directory.
            self._filesView.openDirectory({
                directory: path
            });

            $("#" + self._txtPathId).attr("value", path);

            self.trigger("filesystemview:ondirectoryselected", path);
        });

        self._filesView.on("filesview:onfileserror", function (err) {
            var newErr = new Backbone.Model(err);

            newErr.set("message", err.get("name") + ": " + err.get("error"));

            self.trigger("filesystemview:onerror", newErr);
        });

        $("#" + self._txtPathId).on("change", function () {
            var newDir = $("#" + self._txtPathId).prop("value");

            self._filesView.openDirectory({
                directory: newDir
            })
        });
    },

    // Refetch the current directory.
    refresh: function () {
        var self = this;

        self._filesView.refresh();
        self._dirTree.refresh();
    },

    resize: function () {
        w2ui["fs_view_layout"].resize();
    }
});