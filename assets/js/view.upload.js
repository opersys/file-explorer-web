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

Dropzone.autoDiscover = false;

var UploadView = Backbone.View.extend({

        _uploadFieldId: _.uniqueId("uploadView"),
        _currentDir: null,

        setDirectory: function (newDir) {
            var self = this;

            self._currentDir = newDir;
        },

        render: function () {
            var self = this;

            self.$el.append(self._div);
        },

        initialize: function () {
            var self = this;

            self._div = $("<div></div>")
                .attr("id", self._uploadFieldId)
                .css("width", "300px")
                .css("height", "200px")
                .text("Drop files to upload or click for a dialog box");

            self._dz = new Dropzone(self._div.get(0), {
                url: "/up",
                maxFilesize: 1000000,
                addRemoveLinks: true,

                init: function () {
                    this.on("processing", function () {
                        this.options.url = "/up?p=" + encodeURIComponent(self._currentDir.get("path"));
                    });
                }
            });
        }
    }, {
        get: function () {
            if (!UploadView._uploadObj)
                UploadView._uploadObj = new UploadView();

            return UploadView._uploadObj;
        }
    }
);

