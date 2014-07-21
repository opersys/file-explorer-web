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

var File = Backbone.Model.extend({
    idAttribute: "ino",

    initialize: function () {
        this.attributes["ui-collapsed"] = true;
        this.attributes["ui-row"] = 0;
        this.attributes["ui-children"] = [];
    },

    set: function (n, v) {
        Backbone.Model.prototype.set.apply(this, arguments);

        // Calculate the file's path.
        this.attributes["path"] = this.collection.root() + this.get("name");
    }
});

var DirectoryTree = Backbone.Collection.extend({
    url: "/fs/dirs",
    model: File,

    _openDirs: {}, // Open directories by inode.
    _rows: [],

    getItem: function (n) {
        return this._rows[n];
    },

    getLength: function () {
        return this._rows.length;
    },

    reindex: function () {
        var self = this;
        var dirsToFetch = [], dirFetchCount = 0;

        for (var dir in this._rows) {
            if (dir.get("ui-collapsed") && !_.contains(self._openDirs, dir.get("path")))
                tofetch.push(dir);
        }

        // Fetch all the directories we need to fetch.
        for (var dirToFetch in dirsToFetch) {
            dirToFetch.fetch({
                success: function (dir) {
                    dirFetchCount++;

                    // All fetched?
                    if (dirFetchCount == dirsToFetch.length) {
                        self._rows = [];

                        _.each(_.values(openDirs), function (openDir) {
                            self._row.push();
                        });
                    }
                    // Save the collection.
                    else self._openDirs[dir.get("path")] = dir;
                }
            })
        }
    },

    initialize: function (rootPath) {
        var self = this;

        self._rootPath = rootPath;
        self._openDirs[0] = new Directory(rootPath);

        self._openDirs[0].fetch({success: function () {
            self.reindex();
        }});
    },

    root: function () {
        return this._rootPath;
    }
});

var Directory = Backbone.Collection.extend({
    model: File,

    url: function() {
        return "/fs/dirs?p=" + this._root;
    },

    initialize: function (rootPath) {
        this._root = rootPath;
    },

    root: function () {
        return this._rootPath;
    }
});

var Files = Backbone.Collection.extend({
    model: File,

    url: function() {
        return "/fs/files?p=" + this._rootPath;
    },

    getItem: function (i) {
        return this.at(i);
    },

    getLength: function () {
        return this.length;
    },

    initialize: function (rootPath) {
        this._rootPath = rootPath;
    },

    root: function () {
        return this._rootPath;
    }
});