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

var fs = require("fs");
var path = require("path");
var _ = require("underscore");

var _adapters = {
    jstree: function (stat) {
        return {
            id: "",
            text: stat.name,
            state: {
                opened: stat.name == "/",
                disabled: false,
                selected: false
            },
            children: (stat.isDir ? true : []),
            data: stat
        }
    },

    none: function (stat) {
        return stat;
    }
};

function stat2json(filepath, fnadapter, filest) {
    if (!filest)
        filest = fs.statSync(filepath);

    return fnadapter({
        name: filepath == "/" ? "/" : path.basename(filepath),
        path: filepath,
        ino: filest.ino,
        uid: filest.uid,
        gid: filest.gid,
        size: filest.size,
        blksize: filest.blksize,
        blocks: filest.blocks,
        nlink: filest.nlink,
        atime: filest.atime,
        mtime: filest.mtime,
        ctime: filest.ctime,
        isFile: filest.isFile(),
        isDir: filest.isDirectory(),
        isBlockDev: filest.isBlockDevice(),
        isCharDev: filest.isCharacterDevice(),
        isFIFO: filest.isFIFO(),
        isSocket: filest.isSocket()
    });
}

exports.get = function (req, res) {
    var rpath, fnadapter, fslist = [];

    // Handle data adapters.
    fnadapter = _adapters.none;

    if (req.query.a) {
        if (_adapters.hasOwnProperty(req.query.a))
            fnadapter = _adapters[req.query.a];
        else
            throw new Exception("Unknown adapter");
    }

    // No "p" parameter means we dump data for the root.
    if (!req.query.p) {
        res.json([stat2json("/", fnadapter)]);
        return;
    }
    else
        rpath = req.query.p;

    fs.readdir(rpath, function (err, files) {
        if (err) {
            // TODO: ERROR CODE.
            console.log(err);
            res.json([]);
            return;
        }

        _.each(files, function (file) {
            var filepath = path.join(rpath, file);
            var filest = fs.statSync(filepath);

            if ((req.params.part == "files") || (req.params.part == "dirs" && filest.isDirectory()))
                fslist.push(stat2json(filepath, fnadapter, filest))
        });

        res.json(fslist);
    });
};