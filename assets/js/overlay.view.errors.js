/*
 * Copyright (C) 2014-2015, Opersys inc.
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

var ErrorsOverlay = Backbone.View.extend({

    initialize: function (options) {
        this._options = options.options;
        this._errors = options.errors;
    },

    render: function () {
        var overlayEl = this.$el;
        var overlayUl = $("<ul></ul>");

        overlayEl.css("margin", "1em");

        if (this._errors && this._errors.length > 0) {
            _.each(this._errors, function (err) {
                var overlayLi = $("<li></li>").text(err.get("message"));
                overlayUl.append(overlayLi);
            });

            overlayEl.append(overlayUl);
        }
        else overlayEl.append($("<div></div>").text("No errors were registered."));
    }
});