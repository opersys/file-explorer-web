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

var Event = Backbone.Model.extend({ });

var Events = Backbone.Collection.extend({
    model: Event,

    getItem: function (i) {
        return this.at(i);
    },

    getLength: function () {
        return this.length;
    },

    _onFileChanged: function (m, opts) {
        var self = this;
        var pa = m.previousAttributes();

        if (m.hasChanged("size")) {
            var newSize, oldSize;

            newSize = Humanize.filesizeformat(m.get("size"));
            oldSize = Humanize.filesizeformat(pa["size"]);

            self.add(new Event({
                type: "change",
                attr: "size",
                file: m.get("path"),
                time: moment().format("HH:mm:ss"),
                msg: "Size change: " + m.get("path") + ", from: " + oldSize + " to " + newSize
            }));
        }
    },

    _onFileCreated: function (m, col, opts) {
        var self = this;

        self.add(new Event({
            type: "create",
            file: m.get("path"),
            time: moment().format("HH:mm:ss"),
            msg: "Created: " + m.get("path")
        }));
    },

    _onFileDeleted: function (m, col, opts) {
        var self = this;

        self.add(new Event({
            type: "delete",
            file: m.get("path"),
            time: moment().format("HH:mm:ss"),
            msg: "Deleted: " + m.get("path")
        }));
    },

    initialize: function (models, opts) {
        var self = this;

        self._fs = opts.fs;

        self._fs.on("change", function (m, opts) {
            self._onFileChanged.apply(self, [m, opts])
        });

        self._fs.on("add", function (m, col, opts) {
            self._onFileCreated.apply(self, [m, col, opts]);
        });

        self._fs.on("remove", function (m, col, opts) {
            self._onFileDeleted.apply(self, [m, col, opts]);
        });
    }
});