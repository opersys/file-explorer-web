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

var ServerMessagePopup = MessagePopup.extend({

    initialize: function (options) {
        ConfirmPopup.prototype.initialize.apply(this, [options]);

        this.title = "Error";
        this._serverMsg = options.serverMsg;
        this._msg = options.msg
    },

    renderBody: function ($body) {
        $body.append(
            $("<div></div>").text(this._msg));
        $body.append(
            $("<pre></pre>").text(this._serverMsg));
    }
});