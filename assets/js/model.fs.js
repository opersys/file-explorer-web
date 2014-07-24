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
    idAttribute: "name",

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

var Directory = Backbone.Collection.extend({
    model: File,

    url: function() {
        return "/fs/dirs?p=" + this._root;
    },

    initialize: function (rootPath) {
        this._root = rootPath;

        this._ev = new EventSource("/fsev?p=" + self._currentDir);

        this._ev.addEventListener("create", function (ev) {
            var data = JSON.parse(ev.data);
        });

        this._ev.addEventListener("delete", function (ev) {
            var data = JSON.parse(ev.data);
        });
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
        var self = this;

        this._rootPath = rootPath;
        this._ev = new EventSource("/fsev?p=" + this._rootPath);

        this._ev.addEventListener("create", function (ev) {
            var data = JSON.parse(ev.data);

            console.log("Created: " + data.path);

            self.add(data.stat);
        });

        this._ev.addEventListener("delete", function (ev) {
            var data = JSON.parse(ev.data);

            console.log("Deleted: " + data.path);

            self.remove(data.stat.name);
        });
    },

    root: function () {
        return this._rootPath;
    }
});