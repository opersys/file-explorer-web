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

var _ = require("underscore");
var fsx = require("fs-extra");
var path = require("path");
var eventSource = require("event-source-emitter");
var access = require("../unix-access.js");
var posix = require("../posix.js");
var Inotify = require("../inotify.js").Inotify;
var Cache = require("mem-cache");

// Current inotify instance.
var inotify = new Inotify();

//
var renameCache = new Cache();

var _adapters = {
    jstree: function (stat) {
        var r, isBad;

        isBad = (!stat.canRead) || (stat.error != null);

        r = {
            id: stat.path,
            text: stat.name,
            state: {
                opened: stat.name == "/",
                disabled: false,
                selected: false
            },
            data: stat,
            type: "default"
        };

        if (isBad)
            r.type = "no-access";
        else
            r.children = (stat.isDir ? true : []);

        return r;
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

function ext2icon(filepath) {
    var ext = path.extname(filepath).substring(1).toLowerCase();
    var icon = path.join("icons", ext + ".png");

    // Handle folders.
    try {
        if (fsx.statSync(filepath).isDirectory())
            return path.join("icons", "_folder.png");
    } catch (ex) {
        return path.join("icons", "_blank.png");
    }

    if (ext != "" && fsx.existsSync(path.join("public", icon)))
        return icon;
    else
        // Default icon
        return path.join("icons", "_blank.png");
}

function stat2json(filepath, fnadapter, filest) {
    var upwd, gpwd;

    if (!fnadapter)
        fnadapter = _adapters.none;

    if (!filest) {
        try {
            filest = fsx.statSync(filepath);
        } catch (ex) {
            filest = fnadapter({
                path: filepath,
                name: filepath == "/" ? "/" : path.basename(filepath),
                error: "stat() error: " + ex
            });
        }
    }

    try {
        upwd = posix.getpwnam(filest.uid);
    } catch (ex) {
        upwd = "?";
    }
    try {
        gpwd = posix.getgrnam(filest.gid);
    } catch (ex) {
        gpwd = "?";
    }

    return fnadapter({
        name: filepath == "/" ? "/" : path.basename(filepath),
        icon: ext2icon(filepath),
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
        isSocket: filest.isSocket(),
        canRead: access.sync(filepath, "r"),
        canWrite: access.sync(filepath, "w"),
        canEnter: access.sync(filepath, "x")
    });
}

exports.event = function (req, res) {
    var rpath, cbCount = 0, lastCbTime, lastDelta, avgDelta = 0, sumDelta = 0;

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
            watch_for:
                Inotify.IN_CREATE |
                    Inotify.IN_DELETE |
                    Inotify.IN_MODIFY |
                    Inotify.IN_ATTRIB |
                    Inotify.IN_MOVED_FROM |
                    Inotify.IN_MOVED_TO,

            callback: function (event) {
                var evType = null, nowTs;

                if (evWrapper.watchId < 0) return;

                // Calculate the average delay between callbacks.
                nowTs = new Date().getTime();

                if (lastCbTime) {
                    cbCount++;

                    lastDelta = nowTs - lastCbTime;
                    sumDelta += lastDelta;
                    avgDelta = sumDelta / cbCount;
                }

                lastCbTime = new Date().getTime();

                // The interface will certainly take 1 event per second without
                // a itch so reset the rate counters.
                if (avgDelta > 1) {
                    cbCount = 0;
                    sumDelta = 0;
                    avgDelta = 0;
                }

                // If we reach 100 calls with a delay < 1 second, stop the inotify
                // watch.
                if (cbCount >= 100 && avgDelta < 1.0) {
                    console.log(
                        "Inotify overflow (" + cbCount +" callbacks, average delta: " + avgDelta + ")");

                    inotify.removeWatch(evWrapper.watchId);
                    evWrapper.watchId = -1;
                    return;
                }

                if (!event.name) return;

                var fpath = path.join(rpath, event.name);

                if (event.mask & Inotify.IN_MOVED_FROM)
                    renameCache.set(event.cookie, event.name, 1000);

                if (event.mask & Inotify.IN_MOVED_TO) {

                    var oldName = renameCache.get(event.cookie);

                    if (oldName) {
                        try {
                            evWrapper.eventSource.emit("rename", {
                                path: fpath,
                                newName: event.name,
                                oldName: oldName,
                                stat: stat2json(fpath)
                            });
                        } catch (ex) {
                            console.log("Stat call failed in 'rename' event: " + fpath);
                        }

                        renameCache.remove(event.cookie);
                    }
                }

                if (event.mask & Inotify.IN_CREATE) evType = "create";
                else if (event.mask & Inotify.IN_MODIFY) evType = "modify";
                else if (event.mask & Inotify.IN_ATTRIB) evType = "modify";
                else if (event.mask & Inotify.IN_DELETE) evType = "delete";

                if (evType && evType != "delete") {
                    try {
                        evWrapper.eventSource.emit(evType, {
                            path: fpath,
                            stat: stat2json(fpath)
                        });
                    } catch (ex) {
                        console.log("Stat call failed in '" + evType + "' event: " + fpath);
                    }
                }
                // We don't have the full stat for the delete event but at least
                // pass the name entry to the interface.
                else if (evType && evType == "delete") {
                    evWrapper.eventSource.emit("delete", {
                        path: fpath,
                        stat: { name: path.basename(fpath) }
                    });
                }
            }
        })
    };
};

// Download
exports.dl = function (req, res) {
    var fileDl;

    if (req.query.p) {
        try {
            fileDl = fsx.createReadStream(req.query.p);

            res.set({
                "Content-Disposition": "attachment; filename=" + path.basename(req.query.p)
            });

            fileDl.on("data", function (chunk) {
                res.send(chunk);
            });

        } catch (ex) {
        }
    }
};

// Upload
exports.up = function (req, res) {
    if (req.files) {
        _.each(req.files, function (file) {
            var target = path.join(req.query.p, file.filename);

            fsx.copy(file.file, target, function (err) {
                if (err)
                    res.end(500);
                else
                    res.end();
            });
        });
    }
};

// File system handler.
exports.get = function (req, res) {
    var rpath, showHidden, fnadapter, fslist = [], errlist = [];

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
    else rpath = req.query.p;

    // No 'h' parameter means we just show all.
    showHidden = !(req.query.h && req.query.h == "0");

    fsx.readdir(rpath, function (err, files) {
        if (err) {
            fslist.push({
                path: rpath,
                name: rpath == "/" ? "/" : path.basename(rpath),
                error: "readdir() failed: " + err
            });
        }

        _.each(files, function (file) {
            var filest, filepath = path.join(rpath, file);

            try {
                filest = fsx.statSync(filepath);
            } catch (ex) {
                fslist.push({
                    path: filepath,
                    name: filepath == "/" ? "/" : path.basename(filepath),
                    error: "stat() failed: " + ex
                });
                return;
            }

            if (!showHidden && file.charAt(0) == ".")
                return;

            if ((req.params.part == "files") || (req.params.part == "dirs" && filest.isDirectory()))
                fslist.push(stat2json(filepath, fnadapter, filest))
        });

        res.json(fslist);
    });
};