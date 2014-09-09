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

var mainView,
    options = new Options();

var resizeWindow = function () {
    $("#mainLayout")
        .width($(window).width())
        .height($(window).height());

    w2ui["fs_layout"].resize();
};

$(document).ready(function () {
    var options = new Options();

    options.fetch();
    options.initOption("columns", ["name", "uid", "gid", "size"]);
    options.initOption("showHidden", false);
    options.initOption("sortInfo", { field: "name", desc: false });
    options.initOption("directory", true);
    options.initOption("lastDirectory", "/");

    mainView = new MainView({
        el: $("#mainLayout"),
        options: options
    });

    options.activate();

    $(window).resize(_.debounce(resizeWindow, 100));

    // Reformat the window content.
    resizeWindow();
});