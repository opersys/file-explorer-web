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

var FilesView = Backbone.View.extend({

    refresh: function () {
        this._filelistView.refresh();
    },

    _onFileSelected: function (files) {
        this.trigger("filesview:onfileselected", [files]);
    },

    _onDirectorySelected: function () {

    },

    _onDirectoryFetched: function () {
        var self = this;

        self._filelistView.setDirectory(self._files, self._currentDir);

        self.trigger("filesview:ondirectoryselected", self._currentDir);

        if (self._files.getErrors().length > 0) {
            self._files.getErrors().each(function (m) {
                self.trigger("filesview:onfileserror", m);
            });
        }
    },

    _onSortChange: function () {
        var self = this;

        if (self._currentDir)
            self.openDirectory(self._currentDir);
    },

    openDirectory: function (dir) {
        var self = this, sortInfo;

        self._currentDir = dir;

        // Must close the collection to free the event source.
        if (self._files)
            self._files.close();

        sortInfo = self._options.getOptionValue("sortInfo");

        self._files = new Files({
            rootPath: self._currentDir.get("path"),
            showHidden: self._options.getOptionValue("showHidden"),
            sortField: sortInfo.field,
            sortDesc: sortInfo.desc
        });

        self._eventsView.setEvents(self._files.getEvents());

        self._files.fetch({
            reset: true,
            success: function () {
                self._onDirectoryFetched.apply(self);
            }
        });
    },

    initialize: function (opts) {
        var self = this;

        self._options = opts.options;

        // Initialize the internal layout
        self.$el.w2layout({
            name: "files_events_view_layout",
            padding: 4,
            panels: [
                {
                    type: "main"
                },
                {
                    type: "preview",
                    size: 150
                }
            ]
        });

        self._filelistView = new FileListView({
            el: w2ui["files_events_view_layout"].el("main"),
            options: self._options
        });

        self._eventsView = new EventsView({
            el: $(w2ui["files_events_view_layout"].el("preview")).addClass("slickgrid-no-header"),
            options: self._options
        });

        self._filelistView.on("filelistview:onfilesselected", function (files) {
            self._onFileSelected.apply(self, [files]);
        });

        self._filelistView.on("filelistview:ondirectoryloaded", function (dir) {
            self._onDirectorySelected.apply(self, [dir]);
        });

        self._options.getOption("sortInfo").on("change", function () {
            self._onSortChange.apply(self);
        });
    },

    resize: function () {
        w2ui["files_events_view_layout"].resize();
    }
});