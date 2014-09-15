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

var FileListView = Backbone.View.extend({

        _filesOptions: {
            formatterFactory: {
                getFormatter: function () {
                    return function (row, cell, value, col, data) {

                        if (col.field == "ctime" || col.field == "mtime" || col.field == "atime")
                            return moment(data.get(col.field)).format("MMM Do HH:mm");
                        else
                            return data.get(col.field);
                    };
                }
            },

            enableColumnReorder: true,
            enableCellNavigation: true,
            forceFitColumns: true,
            enableAsyncPostRender: true
        },

        // This is the actual list of columns passed to SlickGrid.
        _columns: [],

        _dateTimeFormatter: function (row, cell, value, columnDef, file) {
            return moment(file.get(columnDef.field)).format("MMM Do HH:mm");
        },

        _sizeFormatter: function (row, cell, value, columnDef, file) {
            return Humanize.filesizeformat(file.get(columnDef.field));
        },

        _iconFormatter: function (row, cell, value, columnDef, file) {
            return "...";
        },

        _initializeGrid: function () {
            var self = this;

            self._filesGrid = new Slick.Grid(self.$el, self._files, self._columns, self._filesOptions);

            self._filesGrid.setSelectionModel(new Slick.RowSelectionModel());

            // Wire grid events.
            self._filesGrid.onColumnsReordered.subscribe(function (e, args) {
                self._onColumnReordered.apply(self, [args]);
            });

            self._filesGrid.onSort.subscribe(function (e, args) {
                self._onSort.apply(self, [args]);
            });

            self._filesGrid.onDblClick.subscribe(function (e, args) {
                self._onDblClick.apply(self, [args]);
            });

            self._filesGrid.getSelectionModel().onSelectedRangesChanged.subscribe(function (e, args) {
                self._onSelectedRangeChanged.apply(self, [args]);
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

            var dateTimeCols = ["atime", "ctime", "mtime"];

            _.each(dateTimeCols, function (dtCol) {
                if (self._filesGrid.getColumnIndex(dtCol) != null) {
                    self._columns[self._filesGrid.getColumnIndex(dtCol)].formatter = function () {
                        return self._dateTimeFormatter.apply(self, arguments);
                    };
                }
            });
        },

        // Grid events.

        _onColumnReordered: function (args) {
            var self = this;
            var cols = self._filesGrid.getColumns();
            var colIds = _.map(cols, function (colData) {
                return colData.id;
            });

            this._options.setOptionValue("columns", colIds);
            self._updateColumnsFormatter();
        },

        _onSort: function (args) {
            var self = this;

            // Save the last sort options so they can be restored.
            self._options.setOptionValue("sortInfo", {
                field: args.sortCol.field,
                desc: (!args.sortAsc)
            });
        },

        _onDblClick: function (args) {
            var dataItem = this._filesGrid.getDataItem(args.row);
            this.trigger("filelistview:ondoubleclickaction", dataItem)
        },

        _onSelectedRangeChanged: function (args) {
            var self = this;
            var r, files = [];

            _.each(args, function (range) {
                for (var r = range.fromRow; r <= range.toRow; r++)
                    files.push(self._filesGrid.getDataItem(r));
            });

            self.trigger("filelistview:onfilesselected", files);
        },

        // Other events.

        _onDirectoryFetched: function () {
            var self = this;

            self.trigger("filelistview:ondirectoryloaded", self._currentDir);

            if (!self._filesGrid)
                self._initializeGrid();

            if (self._files.getErrors().length > 0) {
                self._files.getErrors().each(function (m) {
                    self.trigger("filelistview:onfileserror", m);
                });
            }

            self._filesGrid.setData(self._files);
            self._filesGrid.render();
        },

        // Methods.

        getSelectedFiles: function () {
            var self = this;

            return _.map(this._filesGrid.getSelectedRows(), function (r) {
                return self._filesGrid.getDataItem(r);
            });
        },

        setColumns: function (columnsIds) {
            var self = this;
            var cols = _.map(columnsIds, function (colId) {
                return FileListView._availableColumns[colId];
            });

            self._columns = cols;

            if (self._filesGrid) {
                self._filesGrid.setColumns(cols);
                self._updateColumnsFormatter();
                self._filesGrid.render();
            }
        },

        setDirectory: function (files, directory) {
            var self = this;

            self._files = files;
            self._currentDir = directory;

            if (!self._filesGrid)
                self._initializeGrid();

            self._filesGrid.setData(self._files);
            self._filesGrid.render();

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

            self._files.on("change", function () {
                self._filesGrid.invalidate();
                self._filesGrid.updateRowCount();

                self._filesGrid.render();
            });
        },

        resize: function () {
            if (this._filesGrid)
                this._filesGrid.resizeCanvas();
        },

        // Refetch the current directoy.
        refresh: function () {
            this.setDirectory(this._files, this._currentDir);
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
            return FileListView._availableColumns[colId].optionName;
        },

        getAvailableColumns: function () {
            return _.keys(FileListView._availableColumns);
        },

        _availableColumns: {
            "icon": {
                optionName: "Icon", id: "icon", name: "&nbsp;", field: "icon",
                sortable: true, minWidth: 25, maxWidth: 25, renderOnResize: true,
                asyncPostRender: function (cellNode, row, file, colDef) {
                    $(cellNode).empty().append($("<img></img>").attr("src", file.get("icon")));
                }
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
            },
            "atime": {
                optionName: "Last access time", id: "atime", name: "Access time", field: "atime",
                sortable: true
            },
            "ctime": {
                optionName: "Status change time", id: "ctime", name: "Status ch. time", field: "ctime",
                sortable: true
            },
            "mtime": {
                optionName: "Modification time", id: "mtime", name: "Modif. time", field: "mtime",
                sortable: true
            }
        }
    }
);
