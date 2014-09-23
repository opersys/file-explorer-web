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

var OptionsOverlay = Backbone.View.extend({

    initialize: function (options) {
        this._options = options.options;
    },

    render: function () {
        var self = this;
        var ul, optHiddenLi, optConfirmLi, overlayDiv;

        overlayDiv = this.$el;
        overlayDiv.css("margin", "1em");

        ul = $("<ul></ul>");
        optHiddenLi = $("<li></li>")
            .append(
                $("<input></input>")
                    .attr("type", "checkbox")
                    .attr("name", "optShowHidden")
                    .attr("checked", self._options.getOptionValue("showHidden"))
                    .on("change", function () {
                        self._options.setOptionValue("showHidden", $(this).prop("checked"));
                    }))
            .append(
                $("<label></label>")
                    .attr("for", "optShowHidden")
                    .text("Show hidden files"));
        optConfirmLi = $("<li></li>")
            .append(
                $("<input></input>")
                    .attr("type", "checkbox")
                    .attr("name", "optConfirmDelete")
                    .attr("checked", self._options.getOptionValue("confirmDelete"))
                    .on("change", function () {
                        self._options.setOptionValue("confirmDelete", $(this).prop("checked"));
                    }))
            .append(
                $("<label></label>")
                    .attr("for", "optConfirmDelete")
                    .text("Confirm file removal"));

        overlayDiv.append([optHiddenLi, optConfirmLi]);
    }
});