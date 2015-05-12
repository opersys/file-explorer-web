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

$(document).on("ready", function () {
    var cookieVal = $.cookie("error");

    if (cookieVal) {
        if (/^j:/.test(cookieVal))
            cookieVal = decodeURIComponent(JSON.parse(cookieVal.substring(2)));

        if (_.isArray(cookieVal)) {
            if (cookieVal.length == 0)
                $("#loginerror").text(cookieVal[0]);
        } else {
            $("#loginerror").text(cookieVal);
        }
    }
});