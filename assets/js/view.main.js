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

var MainView = Backbone.View.extend({

    _columnsOverlayId: null,
    _optionsOverlayId: null,
    _errorsOverlayId: null,

    _filesystemView: null,
    _errors: [],

    showOptionsOverlay: function () {
        new OptionsOverlay({
            el: $("#" + this._optionsOverlayId),
            options: this._options
        }).render();
    },

    // Display the overlay allowing the selection of the columns that will be
    // displayed in the file manager.
    showColumnsOverlay: function () {
        new ColumnsOverlay({
            el: $("#" + this._columnsOverlayId),
            options: this._options
        }).render();
    },

    showErrorsOverlay: function () {
        new ErrorsOverlay({
            el: $("#" + this._errorsOverlayId),
            errors: this._errors,
            options: this._options
        }).render();
    },

    initialize: function (opts) {
        var self = this;

        self._columnsOverlayId = _.uniqueId("columnsOverlay");
        self._optionsOverlayId = _.uniqueId("optionsOverlay");
        self._errorsOverlayId = _.uniqueId("errorsOverlay");

        self._options = opts.options;

        $("#mainLayout").w2layout({
            name: "fs_layout",
            padding: 4,
            panels: [
                {
                    type: "main",
                    toolbar: {
                        items: [
                            { type: "button", id: "btnRefresh", icon: "icon-refresh" },
                            { type: "drop", id: "btnColumns", caption: "Columns",
                                html: "<div id='" + self._columnsOverlayId + "'></div>",
                                overlay: {
                                    onShow: function () { self.showColumnsOverlay(); }
                                }
                            },
                            { type: "drop", id: "btnOptions", caption: "Options",
                                html: "<div id='" + self._optionsOverlayId + "'></div>",
                                overlay: {
                                    onShow: function () { self.showOptionsOverlay(); }
                                }
                            },
                            { type: 'spacer' },
                            { type: "drop", id: "btnErrors", caption: "Errors",
                                html: "<div id='" + self._errorsOverlayId + "'></div>",
                                overlay: {
                                    width: 400,
                                    onShow: function () { self.showErrorsOverlay(); }
                                },
                                icon: "icon-exclamation-sign"
                            }
                        ],
                        onClick: function (event) {
                            if (event.target == "btnRefresh")
                                self._filesystemView.refresh();
                        }
                    }
                }
            ],
            onResize: function (ev) {
                ev.onComplete = function () {
                    if (self._filesystemView)
                        self._filesystemView.resize();
                };
            }
        });

        this._filesystemView = new FileSystemView({
            el: $(w2ui["fs_layout"].el("main")),
            options: self._options
        });

        this._filesystemView.on("filesystemview:onerror", function (err) {
            var button, toolbar;

            self._errors.push(err);

            console.log("Error: " + err.get("message"));

            // Change the button caption.
            toolbar = w2ui["fs_layout"].get("main").toolbar;
            button = toolbar.get("btnErrors");
            button.caption = "Errors (" + self._errors.length + ")";

            // Change the button color to red to attract attention.
            button.style = "color: red";

            toolbar.refresh();
        });

        this._filesystemView.on("filesystemview:ondirectoryselected", function (path) {
            var button, toolbar;

            self._errors = [];

            // Reset the button caption.
            toolbar = w2ui["fs_layout"].get("main").toolbar;
            button = toolbar.get("btnErrors");
            button.caption = "Errors";

            // Remove the style on the button.
            button.style = "";

            toolbar.refresh();
        });
    }
});