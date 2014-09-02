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

var UploadOverlay = Backbone.View.extend({

    initialize: function (options) {
        this._options = options.options;
    },

    render: function () {
        var self = this;

        self._uploadGrid = $("<table></table>");
        self._uploadDiv = $("<div></div>")
            .attr("class", "dropzone");
        self._uploadObj = UploadView.get();

        self._uploadObj.setElement(self._uploadDiv);
        self._uploadObj.render();

        self.$el
            .append(self._uploadDiv)
            .append(self._uploadGrid);
    },

    hide: function () {
        this._uploadDiv.detach();
    }
});
