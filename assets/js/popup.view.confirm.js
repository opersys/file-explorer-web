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
    _btnOkId: _.uniqueId("confirmPopup"),
    _btnCancelId: _.uniqueId("confirmPopup"),
    _chkConfirmId: _.uniqueId("confirmPopup"),

    // This is the the title of the dialog, set this in the constructor.
    title: "Default title",

    // This is the name of the option to be used to disable confirmation
    // for this specific dialog.
    confirmOption: "",

    // The text accompaying the checkbox.
    confirmOptionText: "",

    initialize: function (options) {
        var self = this;

        self._context = options.context;
        self._buttons = options.buttons;
        self._confirm = options.confirm || function () {};
        self._cancel = options.cancel || function () {};
        self._options = options.options;
        self._showClose = options.showClose || false;
    },

    _onPopupOpened: function () {
        var self = this;

        _.each(self._buttons, function (btnData) {
            $(document.getElementById(btnData.id)).bind("click", function () {
                if (btnData.action)
                    btnData.action.apply(self._context);

                w2popup.close();
            });
        });

        if (self._confirm) {
            $(document.getElementById(self._chkConfirmId)).bind("change", function () {
                self._options.setOptionValue("confirmDelete", $(this).prop("checked"));
            });
        }
    },

    renderBody: function ($body) {},

    render: function () {
        var self = this;
        var body, buttons, btnOk, btnCancel, chkConfirm, main;
        var filelist = $("<ul></ul>");

        // Body
        main = $("<div></div>");

        body = $("<div></div>").attr("rel", "body");

        this.renderBody(body);

        // Buttons.
        if (self.confirmOption)
            chkConfirm = $("<input></input>")
                .attr("id", self._chkConfirmId)
                .attr("type", "checkbox")
                .attr("checked", self._options.getOptionValue(self.confirmOption))
                .add($("<label></label>")
                    .attr("for", self._chkConfirmId)
                    .text(self.confirmOptionText));

        _.each(self._buttons, function (btnData) {
            btnData.id = _.uniqueId("confirmDialog");
            btnData.$btn = $("<button></button>")
                .attr("class", "btn")
                .attr("id", btnData.id)
                .text(btnData.caption);
        });

        buttons = $("<div></div>")
            .attr("rel", "buttons");

        if (self.confirmOption)
            buttons.append(chkConfirm);

        _.each(self._buttons, function (btnData) {
            buttons.append(btnData.$btn);
        });

        body.append(filelist);
        main.append([body, buttons]);

        main.w2popup({
            title: self.title,
            modal: true,
            showClose: self._showClose,

            onOpen: function (event) {
                event.onComplete = function () {
                    self._onPopupOpened.apply(self);
                }
            }
        });
    }
});
