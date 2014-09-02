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

        }).on("activate_node.jstree",
            function (ev, obj) {
                self.trigger("dirtreeview:ondirectoryselected", new File(obj.node.data));
            }
        );
    },

    // Refetch the current directory.
    refresh: function () {
        this.$el.jstree("refresh");
    }
});