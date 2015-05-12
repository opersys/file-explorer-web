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

var UploadOverlay = Backbone.View.extend({

    initialize: function (options) {
        this._options = options.options;
    },

    render: function () {
        var self = this;

        // We can refer directly to the overlay object because
        // w2ui allows for a single overlay at the time.
        var overlay = $("#w2ui-overlay");

        self._uploadDiv = $("<div></div>");
        self.$el.append(self._uploadDiv);

        self._uploadDiv
            .css("width",  overlay.innerWidth())
            .css("height", overlay.innerHeight());
        self._uploadObj = UploadView.get();

        self._uploadObj.setElement(self._uploadDiv);
        self._uploadObj.render();
    },

    hide: function () {
        this._uploadDiv.detach();
    }
});
