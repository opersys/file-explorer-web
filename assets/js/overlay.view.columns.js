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

var ColumnsOverlay = Backbone.View.extend({

    initialize: function (options) {
        this._options = options.options;
    },

    _onColumnCheckClick: function (colId, checked) {
        var curVal = this._options.getOptionValue("columns");

        if (checked)
            this._options.setOptionValue("columns", _.uniq(curVal.concat(colId)));
        else
            this._options.setOptionValue("columns", _.without(curVal, colId));
    },

    render: function () {
        var curVal = this._options.getOptionValue("columns");
        var self = this;
        var overlayEl;
        var overlayDiv = $("<div></div>");
        var overlayUl = $("<ul></ul>");

        overlayEl = this.$el;
        overlayDiv.css("margin", "1em");
        overlayDiv.append(overlayUl);

        _.each(FileListView.getAvailableColumns(), function (colId) {
            var li, chk, lbl, checked;

            checked = _.contains(curVal, colId);

            li = $("<li></li>");
            chk = $("<input></input>")
                .attr("type", "checkbox")
                .attr("name", colId);
            lbl = $("<label></label>")
                .attr("for", colId)
                .text(FileListView.getColumnName(colId));

            if (checked)
                chk.attr("checked", "checked");

            li.append(chk.add(lbl));

            chk.on("change", function () {
                self._onColumnCheckClick.apply(self, [colId, $(this).prop("checked")]);
            });

            overlayUl.append(li);
        });

        overlayEl.append(overlayDiv);
    }
});

