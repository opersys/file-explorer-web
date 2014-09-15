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
    _selectedFiles: [],
    _uploadOverlay: null,

    _onPathTextChange: function () {
        var self = this;
        var newDir = $("#" + self._txtPathId).prop("value");

        self._dirTree.openDirectory(newDir);
    },

    _onTreeViewDirectorySelected: function (dir) {
        var self = this;

        // Clear the errors
        self._currentErrors = [];

        // Open the new directory.
        self._filesView.openDirectory(dir);
    },

    // Double click action in the file explorer.
    _onFileDoubleClickAction: function (file) {
        if (file.get("isDir"))
            this._filesView.openDirectory(file);
        else
            window.open("/dl?p=" + encodeURIComponent(file.get("path")), "_self");
    },

    _onDirectorySelected: function (dir) {
        var self = this;

        $("#" + self._txtPathId).val(dir.get("path"));
        self._currentDir = dir;

        // Forward the directory selection to the main view.
        self.trigger("filesystemview:ondirectoryselected", dir);

        self.updateToolbar();

        // Change the last directory option to the new directory.
        self._options.setOptionValue("lastDirectory", dir.get("path"));

        // Change the directory of the upload singleton.
        UploadView.get().setDirectory(dir);
    },

    _onFilesError: function (err) {
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

        this._selectedFiles = files;

        this.updateToolbar();
    },

    showUploadOverlay: function () {
        this._uploadOverlay = new UploadOverlay({
            el: $("#" + this._uploadOverlayId),
            dir: this._currentDir,
            options: this._options
        });

        this._uploadOverlay.render();
    },

    hideUploadOverlay: function () {
        if (this._uploadOverlay)
            this._uploadOverlay.hide();
    },

    updateToolbar: function () {
        // Update the toolbar, preemptively disable all functions.
        w2ui["fs_view_layout"].get("main").toolbar.disable("btnNew");
        w2ui["fs_view_layout"].get("main").toolbar.disable("btnDelete");
        w2ui["fs_view_layout"].get("main").toolbar.disable("btnDownload");
        w2ui["fs_view_layout"].get("main").toolbar.disable("btnUpload");

        if (this._selectedFiles.length == 1
            && this._selectedFiles[0].get("canRead")
            && !this._selectedFiles[0].get("isDir"))
            w2ui["fs_view_layout"].get("main").toolbar.enable("btnDownload");

        if (this._currentDir.get("canWrite")) {
            w2ui["fs_view_layout"].get("main").toolbar.enable("btnNew");
            w2ui["fs_view_layout"].get("main").toolbar.enable("btnUpload");
        }

        if (this._selectedFiles.length == 1 && this._selectedFiles[0].get("canWrite"))
            w2ui["fs_view_layout"].get("main").toolbar.enable("btnDelete");
    },

    downloadSelectedFiles: function () {
        _.each(this._selectedFiles, function (file) {
            window.open("/dl?p=" + encodeURIComponent(file.get("path")), "_self");
        });
    },

    initialize: function (opts) {
        var self = this;

        self._uploadOverlayId = _.uniqueId("uploadOverlay");
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
                    toolbar: {
                        items: [
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
                            { hint: "New folder",
                                type: "button", id: "btnNew", icon: "icon-file-alt" },
                            { hint: "Delete file",
                                type: "button", id: "btnDelete", icon: "icon-remove" },
                            { hint: "Download selected file",
                                type: "button", id: "btnDownload", "caption": "Download", icon: "icon-download"
                            },
                            { hint: "Upload a file",
                                type: "drop", id: "btnUpload", "caption": "Upload", icon: "icon-upload",
                                html: "<div id='" + self._uploadOverlayId + "'></div>",
                                overlay: {
                                    width: 400,
                                    onShow: function () { self.showUploadOverlay(); },
                                    onHide: function () { self.hideUploadOverlay(); }
                                }
                            }
                        ],
                        onClick: function (ev) {
                            if (ev.target == "btnDownload")
                                self.downloadSelectedFiles();
                        }
                    }
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

        self._dirTree.on("dirtreeview:ondirectoryselected", function (dir) {
            self._onTreeViewDirectorySelected.apply(self, [dir]);
        });

        self._filesView.on("filesview:onfileserror", function (err) {
            self._onFilesError.apply(self, [err]);
        });

        self._filesView.on("filesview:ondirectoryselected", function (path) {
            self._onDirectorySelected.apply(self, [path]);
        });

        self._filesView.on("filesview:onfilesselected", function (files) {
            self._onFilesSelection.apply(self, [files]);
        });

        self._filesView.on("filesview:ondoubleclickaction", function (file) {
            self._onFileDoubleClickAction.apply(self, [file]);
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
        var self = this;

        self._filesView.resize();

        w2ui["fs_view_layout"].resize();
    }
});