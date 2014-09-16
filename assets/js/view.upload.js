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
        _chkOverwriteId: _.uniqueId("uploadView"),
        _currentDir: null,
        _overwrite: false,

        _onCheckOverwriteChange: function (chkBox) {
            var self = this;
            self._overwrite = $(chkBox).prop("checked");
        },

        setDirectory: function (newDir) {
            var self = this;

            self._currentDir = newDir;
        },

        render: function () {
            var self = this;

            // Reinitialize the 'overwrite' checkbox to false.
            self._chkBox.prop("checked", false);

            self._chkBox.bind("change", function () {
                self._onCheckOverwriteChange.apply(self, [this]);
            });

            self.$el.append(self._chkDiv.add(self._div));
        },

        initialize: function () {
            var self = this;

            self._div = $("<div></div>")
                .attr("id", self._uploadFieldId)
                .css("width", "300px")
                .css("height", "200px")
                .text("Drop files to upload or click for a dialog box");

            // This quirky CSS should perhaps be moved in a .css file.

            self._chkBox = $("<input></input>")
                .attr("id", self._chkOverwriteId)
                .attr("type", "checkbox")
                .add($("<span></span>")
                    .css("margin-left", "5px")
                    .css("vertical-align", "top")
                    .text("Overwrite files?"));

            self._chkDiv = $("<div></div>")
                .css("margin-bottom", "10px")
                .append(self._chkBox);

            self._dz = new Dropzone(self._div.get(0), {
                url: "/up",
                maxFilesize: 1000000,
                addRemoveLinks: true,

                init: function () {
                    this.on("processing", function () {
                        var p = encodeURIComponent(self._currentDir.get("path"));
                        var o = self._overwrite ? "1" : "0";
                        this.options.url = "/up?p=" + p + "&o=" + o;
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

