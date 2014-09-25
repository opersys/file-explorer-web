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

var RenamePopup = ConfirmPopup.extend({

    initialize: function (options) {
        ConfirmPopup.prototype.initialize.apply(this, [options]);

        this._to = options.to;
        this._from = options.from;

        this.title = "Confirm rename";
        this.confirmOption = "confirmRename";
        this.confirmOptionText = "Always confirm rename";
    },

    renderBody: function ($body) {
        var self = this;
        var filelist = $("<ul></ul>");

        $body.text("The following file will be renamed:");
        $body.append(
            $("<div></div>").text(this._from + " to " + this._to));

        _.each(self._files, function (file) {
            filelist.append($("<li></li>").text(file.get("name")));
        });

        $body.append(filelist);
    }
});