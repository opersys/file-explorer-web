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

var ConfirmPopup = Backbone.View.extend({

    _action: null,
    _files: null,
    _btnOkId: _.uniqueId("deletePopup"),
    _btnCancelId: _.uniqueId("deletePopup"),
    _chkConfirmId: _.uniqueId("deletePopup"),

    initialize: function (options) {
        var self = this;

        self._files = options.files;
        self._action = options.action;
        self._options = options.options;
    },

    _onPopupOpened: function () {
        var self = this;

        $(document.getElementById(self._btnOkId)).bind("click", function () {
            if (self._action)
                self._action.apply(self, [self._files]);

            w2popup.close();
        });

        $(document.getElementById(self._btnCancelId)).bind("click", function () {
            w2popup.close();
        });

        $(document.getElementById(self._chkConfirmId)).bind("change", function () {
            self._options.setOptionValue("confirmDelete", $(this).prop("checked"));
        })
    },

    renderBody: function () {
    },

    render: function () {
        var self = this;
        var body, buttons, btnOk, btnCancel, chkConfirm, main;
        var filelist = $("<ul></ul>");

        // Body
        main = $("<div></div>");

        body = $("<div></div>")
            .attr("rel", "body")
            .text("The following files will be removed:");

        _.each(self._files, function (file) {
            filelist.append($("<li></li>").text(file.get("name")));
        });

        main.w2popup({
            title: "Confirm removal",
            modal: true,
            onOpen: function (event) {
                event.onComplete = function () {
                    self._onPopupOpened.apply(self);
                }
            }
        });
    }
});
