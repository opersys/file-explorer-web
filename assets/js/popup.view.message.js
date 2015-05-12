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

var MessagePopup = Backbone.View.extend({

    _action: null,
    _files: null,
    _btnOkId: _.uniqueId("confirmPopup"),

    // This is the the title of the dialog, set this in the constructor.
    title: "Default title",

    // This is the name of the option to be used to disable confirmation
    // for this specific dialog.
    confirmOption: "",

    // The text accompaying the checkbox.
    confirmOptionText: "",

    initialize: function (options) {
        var self = this;

        self._files = options.files;
        self._context = options.context;
        self._options = options.options;
    },

    renderBody: function ($body) {},

    _onPopupOpened: function () {
        var self = this;

        $(document.getElementById(self._btnOkId)).bind("click", function () {
            w2popup.close();
        });
    },

    render: function () {
        var self = this;
        var body, buttons, btnOk, main;
        var filelist = $("<ul></ul>");

        // Body
        main = $("<div></div>");

        body = $("<div></div>").attr("rel", "body");

        this.renderBody(body);

        btnOk = $("<button></button>")
            .attr("id", self._btnOkId)
            .attr("class", "btn")
            .text("OK");

        buttons = $("<div></div>")
            .attr("rel", "buttons")
            .append(btnOk)

        body.append(filelist);
        main.append([body, buttons]);

        main.w2popup({
            title: self.title,
            modal: true,
            onOpen: function (event) {
                event.onComplete = function () {
                    self._onPopupOpened.apply(self);
                }
            }
        });
    }
});