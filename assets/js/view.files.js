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

        _filesOptions: {
            formatterFactory: {
                getFormatter: function () {
                    return function (row, cell, value, col, data) {
                        return data.get(col.field);
                    };
                }
            },

            enableColumnReorder: true,
            enableCellNavigation: true,
            forceFitColumns: true
        },

        // This is the actual list of columns passed to SlickGrid.
        _columns: [],

        _sizeFormatter: function (row, cell, value, columnDef, file) {
            return Humanize.filesizeformat(file.get(columnDef.field));
        },

        _iconFormatter: function (row, cell, value, columnDef, file) {
            return "<img src='" + file.get("icon") + "' />";
        },

        _initializeGrid: function () {
            var self = this;

            self._filesGrid = new Slick.Grid(w2ui["fs_view_layout"].el("main"),
                self._files, self._columns, self._filesOptions);

            self._filesGrid.setSelectionModel(new Slick.RowSelectionModel());

            self._filesGrid.onColumnsReordered.subscribe(function (e, args) {
                var cols = self._filesGrid.getColumns();
                var colIds = _.map(cols, function (colData) {
                    return colData.id;
                });

                self._options.setOptionValue("columns", colIds);
            });

            self._filesGrid.onSort.subscribe(function (e, args) {
                self.openDirectory({
                    sortField: args.sortCol.field,
                    sortDesc: (!args.sortAsc)
                })
            });

            self._filesGrid.onDblClick.subscribe(function (e, args) {
                var dataItem = self._filesGrid.getDataItem(args.row);

                window.open("/dl?p=" + encodeURIComponent(dataItem.get("path")), "_self");
            });

            self._updateColumnsFormatter();
        },

        _updateColumnsFormatter: function () {
            var self = this;

            if (self._filesGrid.getColumnIndex("size") != null) {
                self._columns[self._filesGrid.getColumnIndex("size")].formatter = function () {
                    return self._sizeFormatter.apply(self, arguments);
                };
            }

            if (self._filesGrid.getColumnIndex("icon") != null) {
                self._columns[self._filesGrid.getColumnIndex("icon")].formatter = function () {
                    return self._iconFormatter.apply(self, arguments);
                };
            }
        },

        _onDirectoryFetched: function () {
            var self = this;

            if (!self._filesGrid)
                self._initializeGrid();

            if (self._files.getErrors().length > 0) {
                self._files.getErrors().each(function (m) {
                    self.trigger("filesview:onfileserror", m);
                });
            }

            self._filesGrid.setData(self._files);
            self._filesGrid.render();
        },

        setColumns: function (columnsIds) {
            var self = this;
            var cols = _.map(columnsIds, function (colId) {
                return FilesView._availableColumns[colId];
            });

            self._columns = cols;

            if (self._filesGrid) {
                self._filesGrid.setColumns(cols);
                self._updateColumnsFormatter();
                self._filesGrid.render();
            }
        },

        // This function show and fetch a new directory view.
        // The "options" hash might contain:
        //   directory: switch the view to that specific directory,
        //   sortField: sort using that field
        //   sortAsc:   ascent/descent sort, default to asc.
        openDirectory: function (options) {
            var self = this;

            if (options) {
                if (options.hasOwnProperty("directory"))
                    self._currentDir = options.directory;
                if (options.hasOwnProperty("sortField"))
                    self._sortField = options.sortField;
                if (options.hasOwnProperty("sortDesc"))
                    self._sortDesc = options.sortDesc;
            }

            // Save the last sort options so they can be restored.
            self._options.setOptionValue("sortField", self._sortField);
            self._options.setOptionValue("sortDesc", self._sortDesc);

            if (options && options.hasOwnProperty("directory"))
                console.log("Browsing: " + self._currentDir);

            // Must close the collection to free the event source.
            if (self._files)
                self._files.close();

            self._files = new Files({
                rootPath: self._currentDir,
                showHidden: self._options.getOptionValue("showHidden"),
                sortField: self._sortField,
                sortDesc: self._sortDesc
            });

            self._files.fetch({
                reset: true,
                success: function () {
                    self._onDirectoryFetched.apply(self);
                }//,
                //error: function () { self._onDirectoryFetchError.apply(self); }
            });

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

            self.trigger("filesview:ondirectoryselected", self._currentDir);
        },

        // Refetch the current directoy.
        refresh: function () {
            this.openDirectory();
        },

        initialize: function (options) {
            var self = this;

            self._options = options.options;

            // Option traps
            self._options.getOption("columns").on("change", function () {
                var newCols = self._options.getOptionValue("columns");
                self.setColumns(newCols);
            });
        }

    },

    // Static methods.

    {
        getColumnName: function (colId) {
            return FilesView._availableColumns[colId].optionName;
        },

        getAvailableColumns: function () {
            return _.keys(FilesView._availableColumns);
        },

        _availableColumns: {
            "icon": {
                optionName: "Icon", id: "icon", name: "&nbsp;", field: "icon",
                sortable: true, minWidth: 25, maxWidth: 25
            },
            "name": {
                optionName: "File name", id: "name", name: "Name", field: "name",
                sortable: true
            },
            "username": {
                optionName: "Owner username", id: "username", name: "User", field: "username",
                sortable: true
            },
            "groupname": {
                optionName: "Owner groupname", id: "groupname", name: "Group", field: "groupname",
                sortable: true
            },
            "uid": {
                optionName: "Owner user ID", id: "uid", name: "UID", field: "uid",
                sortable: true, minWidth: 30, maxWidth: 50
            },
            "gid": {
                optionName: "Owner group ID", id: "gid", name: "GID", field: "gid",
                sortable: true, minWidth: 30, maxWidth: 50
            },
            "size": {
                optionName: "File size", id: "size", name: "Size", field: "size",
                sortable: true, minWidth: 30
            },
            "modestr": {
                optionName: "File modes", id: "mode", name: "Mode", field: "modestr",
                sortable: false
            },
            "nmode": {
                optionName: "File mode number", id: "nmode", name: "Numeric mode", field: "mode",
                sortable: false
            }
        }
    }
);
