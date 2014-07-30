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

    _nameFormatter: function (row, cell, value, columnDef, file) {
        var nb = file.get("path").split("/").length;

        var spacer = $("<span></span>")
            .css("display", "inline-block")
            .css("height", "1px")
            .css("width", (15 * nb) + "px");

        if (file.get("ui-collapsed"))
            return spacer.append(
                $("<span></span>")
                    .attr("onclick", "FileSystemView_expandPath(" + file.get("ino") + ")")
                    .attr("class", "toggle expand"))[0].outerHTML + file.get("name");
        else
            return spacer.append(
                $("<span></span>")
                    .attr("onclick", "FileSystemView_expandPath(" + file.get("ino") + ")")
                    .attr("class", "toggle collapse"))[0].outerHTML + file.get("name");
    },

    getAvailableColumns: function () {
        return _.keys(this._availableColumns);
    },

    getColumnName: function (colId) {
        return this._availableColumns[colId].name;
    },

    setColumns: function (columnsIds) {
        var self = this;
        var cols = _.map(columnsIds, function (colId) {
            return self._availableColumns[colId];
        });
        this._columns = cols;
        this._filesGrid.setColumns(cols);
        this._filesGrid.render();
    },

    _sizeFormatter: function (row, cell, value, columnDef, file) {
        return Humanize.filesizeformat(file.get(columnDef.field));
    },

    _availableColumns: {
        "icon": { id: "icon", name: "", field: "icon", sortable: true },
        "name": { id: "name", name: "Name", field: "name", sortable: true },
        "uid": { id: "uid", name: "UID", field: "uid", sortable: true },
        "gid": { id: "gid", name: "GID", field: "gid", sortable: true },
        "size": { id: "size", name: "Size", field: "size", sortable: true }
    },

    // This is the actual list of columns passed to SlickGrid.
    _columns: [],

    _filesOptions: {
        formatterFactory:{
            getFormatter: function () {
                return function(row, cell, value, col, data) {
                    return data.get(col.field);
                };
            }
        },

        enableColumnReorder: true,
        enableCellNavigation: true,
        forceFitColumns: true
    },

    updateCurrentDir: function (newDir) {
        var self = this;

        this._currentDir = newDir;
        this._files = new Files(this._currentDir);

        if (this._ev)
            this._ev.close();

        this._files.fetch({
            success: function () {
                self._filesGrid = new Slick.Grid(w2ui["fs_view_layout"].el("main"),
                    self._files, self._columns, self._filesOptions);

                self._columns[self._filesGrid.getColumnIndex("size")].formatter = function () {
                    return self._sizeFormatter.apply(self, arguments);
                };

                self._files.on("add", function () {
                    self._filesGrid.invalidate();
                    self._filesGrid.updateRowCount();

                    // Immediately resize the canvas.
                    self._filesGrid.resizeCanvas();

                    self._filesGrid.render();
                });

                self._files.on("remove", function () {
                    self._filesGrid.invalidate();
                    self._filesGrid.updateRowCount();

                    // Immediately resize the canvas.
                    self._filesGrid.resizeCanvas();

                    self._filesGrid.render();
                });
            }
        });

        self._files.fetch();
    },

    initialize: function (opts) {
        var self = this;

        // Currently selected directory.
        self._currentDir = "/";

        // Initialize the collections.
        self._files = new Files(self._currentDir);
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

        self._options.getOption("columns").on("change", function () {
            var newCols = self._options.getOptionValue("columns");
            self.setColumns(newCols);
        });

        self.render();
    },

    resize: function () {
        w2ui["fs_view_layout"].resize();
    },

    render: function () {
        var self = this;
        var rootPath;

        $(w2ui["fs_view_layout"].el("left")).jstree({
            "core" : {
                'data' : {
                    'url' : function (node) {
                        if (node.id == "#")
                            return "/fs/dirs?a=jstree";
                        else
                            return "/fs/dirs?a=jstree&p=" + node.data.path
                    },
                    'data' : function (node) {
                        return { 'id' : node.id };
                    }
                }
            },
            "ui": {
                "initially_select" : [ "/" ]
            },
            "plugins" : []
        });

        $(w2ui["fs_view_layout"].el("left")).on("activate_node.jstree", function (ev, obj) {
            self.updateCurrentDir(obj.node.data.path);
        });

        self._filesGrid = new Slick.Grid(w2ui["fs_view_layout"].el("main"),
            self._files, self._columns, self._filesOptions);

        rootPath = new Directory();
        rootPath.set({
            "ui-collapsed": false,
            "path": "/"
        });

        self._filesGrid.render();
    }
});