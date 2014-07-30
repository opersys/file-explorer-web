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
var posix = require("posix");
var path = require("path");
var eventSource = require("event-source-emitter");
var _ = require("underscore");
var Inotify = require("inotify").Inotify;

// Current inotify instance.
var inotify = new Inotify();

// Current inotify watch descriptors.
var inWatch = {};

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

function mode2str(mode) {
    var s = "";

    s += (mode & 0400) ? 'r' : '-';

    if (mode & 04000)
        s += (mode & 0100) ? 's' : 'S';
    else
        s += (mode & 0100) ? 'x' : '-';

    s += (mode & 0200) ? 'w' : '-';

    if (mode & 02000)
        s += (mode & 010) ? 's' : 'S';
    else
        s += (mode & 010) ? 'x' : '-';

    s += (mode & 040) ? 'r' : '-';
    s += (mode & 020) ? 'w' : '-';
    s += (mode & 04) ? 'r' : '-';
    s += (mode & 02) ? 'w' : '-';

    if (mode & 01000)
        s += (mode & 01) ? 't' : 'T';
    else
        s += (mode & 01) ? 'x' : '-';

    return s;
}

function stat2json(filepath, fnadapter, filest) {
    var upwd, gpwd;

    if (!filest)
        filest = fs.statSync(filepath);

    if (!fnadapter)
        fnadapter = _adapters.none;

    upwd = posix.getpwnam(filest.uid);
    gpwd = posix.getgrnam(filest.gid);

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
        mode: filest.mode,
        modestr: mode2str(filest.mode),
        username: upwd.name,
        groupname: gpwd.name,
        isFile: filest.isFile(),
        isDir: filest.isDirectory(),
        isBlockDev: filest.isBlockDevice(),
        isCharDev: filest.isCharacterDevice(),
        isFIFO: filest.isFIFO(),
        isSocket: filest.isSocket()
    });
}

exports.event = function (req, res) {
    var rpath;

    // No "p" parameter means we dump data for the root.
    if (!req.query.p)
        rpath = "/";
    else
        rpath = req.query.p;

    // Bundle the event source with the inotify context.
    var evWrapper = {
        path: rpath,

        eventSource: eventSource(req, res, {
            keepAlive: true,

            onClose: function () {
                if (evWrapper.watchId != -1) {
                    console.log("Closed inotify on " + evWrapper.path);
                    inotify.removeWatch(evWrapper.watchId);
                }
            }
        }),

        watchId: inotify.addWatch({
            path: rpath,
            watch_for: Inotify.IN_CREATE | Inotify.IN_DELETE,

            callback: function (event) {
                if (!event.name)
                    return;

                var fpath = path.join(rpath, event.name);

                if (event.mask & Inotify.IN_CREATE) {
                    try {
                        evWrapper.eventSource.emit("create", {
                            path: fpath,
                            stat: stat2json(fpath)
                        });
                    } catch (ex) {
                        console.log("Stat call failed: " + fpath);
                    }
                }
                // We don't have the full stat for the delete event but at least
                // pass the name entry to the interface.
                else if (event.mask & Inotify.IN_DELETE) {
                    evWrapper.eventSource.emit("delete", {
                        path: fpath,
                        stat: { name: path.basename(fpath) }
                    });
                }
            }
        })
    };
};

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