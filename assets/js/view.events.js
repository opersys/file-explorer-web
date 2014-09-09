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

var EventsView = Backbone.View.extend({

    _columns: [
        { id: "time", name: "Time", field: "time", maxWidth: 60 },
        { id: "msg", name: "Message", field: "msg" }
    ],

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

    setEvents: function (ev) {
        var self = this;

        self._fileEvents = ev;

        if (!self._eventGrid)
            self._eventGrid = new Slick.Grid(self.$el, self._fileEvents, self._columns, self._filesOptions);
        else
            self._eventGrid.setData(self._fileEvents);

        self._fileEvents.on("add", function () {
            self._eventGrid.invalidate();
            self._eventGrid.updateRowCount();

            // Immediately resize the canvas.
            self._eventGrid.resizeCanvas();

            self.trigger("eventsview:onnewevent");

            self._eventGrid.render();
        });

        self._fileEvents.on("remove", function () {
            self._eventGrid.invalidate();
            self._eventGrid.updateRowCount();

            // Immediately resize the canvas.
            self._eventGrid.resizeCanvas();

            self.trigger("eventsview:onnewevent");

            self._eventGrid.render();
        });

        self._fileEvents.on("change", function () {
            self._eventGrid.invalidate();
            self._eventGrid.updateRowCount();

            self.trigger("eventsview:onnewevent");

            self._eventGrid.render();
        });
    },

    resize: function () {
        if (this._eventGrid)
            this._eventGrid.resizeCanvas();
    },

    initialize: function (opts) {
        var self = this;

        self._options = opts.options;
    }
});