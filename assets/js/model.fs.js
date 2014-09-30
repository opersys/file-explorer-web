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

    sync: function (method, model, options) {
        var self = this;
        var errorCb = options.error;

        // Fall back to the default apply method for read requests.
        if (method == "read")
            return Backbone.sync.apply(this, arguments);

        // The following methods go through special endpoints.

        if (method == "delete") {
            Backbone.ajax(_.extend(options, {
                type: "POST",
                url: "/rm?f=" + encodeURIComponent(model.get("path"))
            }));

            return;
        }

        if (method == "update") {
            // We can only handle file name changes for now.
            if (model.hasChanged("name")) {
                var from = encodeURIComponent(model.get("path"));
                var to = encodeURIComponent(model.get("name"));

                Backbone.ajax(_.extend(options, {
                    type: "POST",
                    url: "/mv?f=" + from + "&n=" + to
                }));
            }

            return;
        }

        if (method == "create") {
            // The only thing we create is a
            if (model.get("isDir")) {
                Backbone.ajax(_.extend(options, {
                    type: "POST",
                    url: "/mkdir?p=" + encodeURIComponent(model.get("path"))
                }));

                // Immediately destroy the model since it'll appear by itsef as a newly
                // created directory inside an event sent by the server side.
                model.destroy();
            }

            return;
        }

        // And those are unsupported.

        if (method == "patch") {
            throw "Method " + method + " unsupported";
        }
    }
});

var Files = Backbone.Collection.extend({
    model: File,

    url: function () {
        return "/fs/files?p=" + this._rootPath;
    },

    getItem: function (i) {
        return this.at(i);
    },

    getLength: function () {
        return this.length;
    },

    getErrors: function () {
        return this._errors;
    },

    getEvents: function () {
        return this._fileEvents;
    },

    comparator: function (m1, m2) {
        var r;

        if (m1.get(this._sortField) < m2.get(this._sortField))
            r = -1;
        else if (m2.get(this._sortField) < m1.get(this._sortField))
            r = 1;
        else
            r = 0;

        if (this._sortDesc)
            r = -r;

        return r;
    },

    // This object must be closed since it opens an event source which are
    // in limited quantity.
    close: function () {
        if (this._ev) this._ev.close();
    },

    initialize: function (options) {
        var self = this;

        this._rootPath = options.rootPath;
        this._ev = new EventSource("/fsev?p=" + this._rootPath);
        this._showHidden = options.showHidden;
        this._fileEvents = new Events([], { fs: this });

        if (options.hasOwnProperty("sortField"))
            this._sortField = options.sortField;
        if (options.hasOwnProperty("sortDesc"))
            this._sortDesc = options.sortDesc;

        this._ev.addEventListener("create", function (ev) {
            var data = JSON.parse(ev.data);

            console.log("Created: " + data.path);

            self.add(data, {merge: true});
        });

        this._ev.addEventListener("delete", function (ev) {
            var data = JSON.parse(ev.data);

            console.log("Deleted: " + data.path);

            self.remove(data.name);
        });

        this._ev.addEventListener("modify", function (ev) {
            var data = JSON.parse(ev.data);

            console.log("Modified: " + data.path);

            self.get(data.name).set(data);
        });

        this._ev.addEventListener("rename", function (ev) {
            var data = JSON.parse(ev.data);

            console.log("Renamed: " + data.path);

            self.get(data.oldName).set(data);
        });
    },

    parse: function (response) {
        var self = this;
        var newResponse = [];

        this._errors = new Backbone.Collection();

        _.each(response, function (respItem) {
            // Handle hidden files for the JStree layout.
            if (!self._showHidden) {
                if (respItem.name.charAt(0) != ".")
                    newResponse.push(respItem);
            }
            else newResponse.push(respItem);

            // Handle errors
            if (respItem.error)
                self._errors.add(new Backbone.Model(respItem));
        });

        return newResponse;
    },

    root: function () {
        return this._rootPath;
    }
});