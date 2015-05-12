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

var DeletePopup = ConfirmPopup.extend({

    initialize: function (options) {
        options.buttons = [
            {
                caption: "Yes",
                action: options.confirm
            },
            {
                caption: "No"
            }
        ];

        ConfirmPopup.prototype.initialize.apply(this, [options]);

        this._files = options.files;
        this.title = "Confirm file removal";
        this.confirmOption = "confirmDelete";
        this.confirmOptionText = "Always confirm removal";
    },

    renderBody: function ($body) {
        var self = this;
        var filelist = $("<ul></ul>");

        $body.text("The following files will be removed:");

        _.each(self._files, function (file) {
            filelist.append($("<li></li>").text(file.get("name")));
        });

        $body.append(filelist);
    }
});