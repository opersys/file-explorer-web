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

// This is a copy of SlickGrid default text editor, adapted to handle
// Backbone.js models. There is sadly no way to just override the loadValue
// function.
function BackboneTextEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;

    this.init = function () {
        $input = $("<INPUT type=text class='editor-text' />")
            .appendTo(args.container)
            .bind("keydown.nav", function (e) {
                if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT) {
                    e.stopImmediatePropagation();
                }
            })
            .focus()
            .select();
    };

    this.destroy = function () {
        $input.remove();
    };

    this.focus = function () {
        $input.focus();
    };

    this.getValue = function () {
        return $input.val();
    };

    this.setValue = function (val) {
        $input.val(val);
    };

    this.loadValue = function (item) {
        // Read the current value from Backbone.
        defaultValue = item.get(args.column.field) || "";
        $input.val(defaultValue);
        $input[0].defaultValue = defaultValue;
        $input.select();
    };

    this.serializeValue = function () {
        return $input.val();
    };

    this.applyValue = function (item, state) {
        // Use Backbone to change the value.
        item.set(args.column.field, state);
        item.save();
    };

    this.isValueChanged = function () {
        return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
    };

    this.validate = function () {
        if (args.column.validator) {
            var validationResults = args.column.validator($input.val());
            if (!validationResults.valid) {
                return validationResults;
            }
        }

        return {
            valid: true,
            msg: null
        };
    };

    this.init();
}


