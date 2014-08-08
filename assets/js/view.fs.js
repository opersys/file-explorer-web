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

    _onPathTextChange: function () {
        var newDir = $("#" + self._txtPathId).prop("value");

        self._filesView.openDirectory({
            directory: newDir
        });
    },

    _onTreeViewDirectorySelected: function (path) {
        var self = this;

        // Clear the errors
        self._currentErrors = [];

        // Open the new directory.
        self._filesView.openDirectory({
            directory: path
        });
    },

    // Double click action in the file explorer.
    _onFilesDoubleClickAction: function (file) {
        if (file.get("isDir")) {
            this._filesView.openDirectory({
                directory: file.get("path")
            });
        } else {

        }
    },

    _onDirectorySelected: function (path) {
        var self = this;

        $("#" + self._txtPathId).val(path);

        // Forward the directory selection to the main view.
        this.trigger("filesystemview:ondirectoryselected", path);
    },

    _onFilesError: function () {
        var newErr = new Backbone.Model(err);

        newErr.set("message", err.get("name") + ": " + err.get("error"));

        this.trigger("filesystemview:onerror", newErr);
    },

    _onFilesSelection: function (files) {
        if (files.length == 0)
            $("#lblSelection").text("");
        else if (files.length == 1)
            $("#lblSelection").text(files[0].get("name"));
        else
            $("#lblSelection").text(files.length + " files selected.");
    },

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
                                  "<input size='75' id='" + self._txtPathId + "'" +
                                  "       style='padding: 3px; border-radius: 2px; border: 1px solid silver' />" +
                                  "</div>"
                        },
                        { type: "html", id: "lblSelection" ,
                            html: "<div id='lblSelection' style='padding: 3px 10px;'></div>"
                        },
                        { type: "spacer" },
                        { type: "button", id: "btnDownload", "caption": "Download", icon: "icon-download" },
                        { type: "button", id: "btnUpload", "caption": "Upload", icon: "icon-upload" }
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

        // Event wiring.

        self._dirTree.on("dirtreeview:ondirectoryselected", function (path) {
            self._onTreeViewDirectorySelected.apply(self, [path]);
        });

        self._filesView.on("filesview:onfileserror", function (err) {
            self._onFilesError.apply(self, [err]);
        });

        self._filesView.on("filesview:ondirectoryselected", function (path) {
            self._onDirectorySelected.apply(self, [path]);
        });

        self._filesView.on("filesview:onfilesselection", function (files) {
            self._onFilesSelection.apply(self, [files]);
        });

        self._filesView.on("filesview:ondoubleclickaction", function (file) {
            self._onFilesDoubleClickAction.apply(self, [file]);
        });

        $("#" + self._txtPathId).on("change", function () {
            self._onPathTextChange.apply(self);
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