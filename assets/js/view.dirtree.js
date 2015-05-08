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

var DirTreeView = Backbone.View.extend({

    _openDirParts: [],
    _openCurrent: null,
    _hasWarnedAboutRunningAsRoot: false,
    _rootTooltip: null,

    initialize: function (options) {
        var self = this;

        this._options = options.options;

        self.$el.jstree({
            "core" : {
                "data" : {
                    "url" : function (node) {
                        var showHidden = self._options.getOptionValue("showHidden") ? 1 : 0;

                        if (node.id == "#")
                            return "/fs/dirs?a=jstree";
                        else
                            return "/fs/dirs?h=" + showHidden + "&a=jstree&p=" + node.data.path
                    },
                    "data" : function (node) {
                        return { "id" : node.id };
                    }
                }
            },
            "types": {
                "no-access": {
                    "icon": "/icons/_noaccess.png"
                }
            },
            "ui": {
                "initially_select" : [ "/" ]
            },
            "plugins" : [ "search", "types" ]

        }).on("select_node.jstree",
            function (ev, obj) {
                if (obj.node.type == "no-access") {
                    if (!self._hasWarnedAboutRunningAsRoot)
                    {
                        var chkId = _.uniqueId("opentip");
                        var targetTreeItem = $(self.$el.jstree().get_node(obj.node.id, true));
                        var targetTreeIcon = $(targetTreeItem.children()[1]).children([0]);

                        self._rootTooltip = new Opentip(self.$el, {
                            title: "Having access error?",
                            target: targetTreeIcon,
                            style: "warnPopup",
                            targetJoint: "center right",
                            tipJoint: "top right",
                            showOn: null
                        });
                        self._rootTooltip.setContent(
                            "<p>Unless File Explorer runs as root, you won't be able to all the files and " +
                            "directories on your device. If you have one of the 'su' apps installed, enable the " +
                            "'Run as root' option above before starting the service.</p>" +
                            "<p>If you're using the AOSP emulator run the following on your computer and don't " +
                            "make use of the 'Start the service' button.</p>" +
                            "<pre>$ adb shell 'cd /data/user/0/com.opersys.processexplorer/files &amp;&amp; ./node ./app.js'</pre>" +
                            '<input id="' + chkId + '" type="checkbox" />' +
                            '<label for="' + chkId + '">Don\'t show this message again</label>'
                        );

                        self._rootTooltip.show();

                        $(document.getElementById(chkId)).on("click", function () {
                            self._rootTooltip.hide();
                            self._hasWarnedAboutRunningAsRoot = true;
                        });
                    }
                    else rootTooltip.hide();
                }

                self.trigger("dirtreeview:ondirectoryselected", new File(obj.node.data));
            }
        ).on("ready.jstree",
            function () {
                if (self._options.getOptionValue("lastDirectory"))
                    self.openDirectory(self._options.getOptionValue("lastDirectory"));
            }
        );
    },

    _endOpenDirectory: function (done) {
        var self = this;

        console.log("Ending openDirectory at: " + self._openCurrent);

        // Activate the last node.
        if (!done)
            self.$el.jstree("select_node", self._openCurrent);

        self._openCurrent = null;
        self._openDirParts = [];
    },

    _doOpenDirectory: function () {
        var self = this;

        if (self.$el.jstree("get_node", self._openCurrent)) {

            console.log("Will try to load: " + self._openCurrent);

            self.$el.jstree("load_node", self._openCurrent, function () {
                console.log("Loaded: " + self._openCurrent);

                self.$el.jstree("open_node", self._openCurrent);

                var newPart = self._openDirParts.shift();

                if (newPart) {
                    if (/\/$/.test(self._openCurrent))
                        self._openCurrent += newPart;
                    else
                        self._openCurrent += ("/" + newPart);

                    self._doOpenDirectory();
                }
                else
                    self._endOpenDirectory(false);
            });

            return;
        }

        self._endOpenDirectory(true);
    },

    openDirectory: function (dir) {
        var self = this;

        console.log("Opening directory: " + dir);

        self._openDirParts = dir.split("/");
        self._openDirParts.shift();
        self._openCurrent = "/";

        self._doOpenDirectory();
    },

    // Refetch the current directory.
    refresh: function () {
        this.$el.jstree("refresh");
    }
});