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

//
var evTrap = {};

var _adapters = {
    jstree: function (stat) {
        var r;

        r = {
            id: stat.path,
            text: stat.name,
            state: {
                opened: stat.name == "/",
                disabled: false,
                selected: false
            },
            data: stat,
            children: []
        };

        if (stat.isDir && stat.canRead)
            r.children = true;
        if (stat.isSymlink && stat.canRead && stat.link.isDir)
            r.children = true;

        // All for type override, but fallback on the default otherwise.
        if (stat.type)
            r.type = stat.type;
        else
            r.type = "default";

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

function ext2icon(filepath, type, filest) {
    var ext = path.extname(filepath).substring(1).toLowerCase();
    var icon = path.join("icons", ext + ".png");

    // Symlinks
    if (type === "broken-symlink")
        return path.join("icons", "_noaccess.png");

    else if (type === "symlink")
        return path.join("icons", "_symlink.png");

    // Handle folders.
    else if (filest.isDirectory() /*fsx.statSync(filepath).isDirectory()*/)
        return path.join("icons", "_folder.png");

    // Other kinds of files
    else if (ext != "" && fsx.existsSync(path.join("public", icon)))
        return icon;

    // Default icon
    else
        return path.join("icons", "_blank.png");
}

function stat2json(filepath, fnadapter, filest) {
    var upwd, gpwd, canRead, canWrite, canEnter, type;

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

    canRead = access.sync(filepath, "r");
    canWrite = access.sync(filepath, "w");
    canEnter = access.sync(filepath, "x");

    // Judge the type of the file
    if (filest.isDirectory() && (!canRead || !canEnter))
        type = "no-access";
    else if (filest.isSymbolicLink() && (!canRead || !canEnter))
        type = "broken-symlink";
    else if (filest.isSymbolicLink())
        type = "symlink";

    return fnadapter({
        name: filepath == "/" ? "/" : path.basename(filepath),
        icon: ext2icon(filepath, type, filest),
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
        mode: (filest.mode & ~0xf000).toString(8),
        modestr: mode2str(filest.mode),
        username: upwd.name,
        groupname: gpwd.name,
        isFile: filest.isFile(),
        isDir: filest.isDirectory(),
        isBlockDev: filest.isBlockDevice(),
        isCharDev: filest.isCharacterDevice(),
        isFIFO: filest.isFIFO(),
        isSocket: filest.isSocket(),
        isSymlink: filest.isSymbolicLink(),
        canRead: canRead,
        canWrite: canWrite,
        canEnter: canEnter,
        link: filest.link,
        type: type
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
                        var evData = stat2json(fpath);

                        if (evTrap[fpath]) {
                            evTrap[fpath].apply(this, [evData]);
                            delete evTrap[fpath];
                        }

                        evWrapper.eventSource.emit(evType, evData);
                    } catch (ex) {
                        console.log("Stat call failed in '" + evType + "' event: " + fpath + ", exception: " + ex);
                    }
                }
                // We don't have the full stat for the delete event but at least
                // pass the name entry to the interface.
                else if (evType && evType == "delete") {
                    evWrapper.eventSource.emit("delete", {
                        path: fpath,
                        name: path.basename(fpath)
                    });
                }
            }
        })
    };
};

// Download
exports.dl = function (req, res) {
    if (req.query.p) {
        try {
            res.sendFile(req.query.p, {
                headers: {
                    "Content-Disposition": "attachment; filename=" + path.basename(req.query.p)
                }
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

            // Handle overwrite.
            if (req.query.o && req.query.o == "0") {
                var postfix = "", idx = 0;

                while (fsx.existsSync(target + postfix)) {
                    postfix = ("." + (++idx));
                }

                target += postfix;
            }

            fsx.copy(file.file, target, function (err) {
                if (err)
                    res.status(500).end();
                else {
                    var tmpupdir = path.dirname(path.dirname(file.file));

                    // Delete the temporary file created by the upload
                    // middleware.
                    try {
                        fsx.remove(tmpupdir);
                    } catch (ex) {
                        console.log("Could not delete " + tmpupdir);
                    }

                    res.end();
                }
            });
        });
    }
};

// File system handler.
exports.get = function (req, res) {
    var rpath, showHidden, fnadapter, fslist = [];

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
                filest = fsx.lstatSync(filepath);
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

            // Crack open symbolic links
            if (filest.isSymbolicLink()) {
                var slst, sltarget = fsx.readlinkSync(filepath);

                // Symlinks are guaranteed to have at least a 'link' object in their file
                // stat data. For broken symlinks, this will only contain a 'path' member

                try {
                    slst = stat2json(sltarget, _adapters.none, fsx.statSync(sltarget));
                    filest.link = slst;
                } catch (ex) {
                    filest.link = {};
                }

                filest.link.path = sltarget;
            }

            if ((req.params.part === "files") ||
                (req.params.part === "dirs" && filest.isDirectory()) ||
                (req.params.part === "dirs" && filest.isSymbolicLink() && filest.link.isDir))
                fslist.push(stat2json(filepath, fnadapter, filest))
        });

        res.json(fslist);
    });
};

// Delete (POST)
exports.rm = function (req, res) {
    if (!req.query.f)
        res.status(500).end("Argument error. No files provided.");

    else {
        // Handles rmdir as well as rm for convenience on the front end.
        fsx.stat(req.query.f, function (err, fstat) {
            if (fstat.isDirectory()) {
                fsx.rmdir(req.query.f, function (err) {
                    if (err)
                        res.status(500).end("Delete error: " + err);
                    else
                        res.end();
                });
            } else {
                fsx.unlink(req.query.f, function (err) {
                    if (err)
                        res.status(500).end("Delete error: " + err);
                    else
                        res.end();
                });
            }
        });

    }
};

// Mkdir (POST)
exports.mkdir = function (req, res) {
    if (!req.query.p)
        res.status(500).end("Argument error. No pathname provided.");

    else {
        // Pass a flag back to the client saying the directory that
        // was just created has been created with an mkdir command.
        evTrap[req.query.p] = function (evData) {
            evData.isMkdir = true;
        };

        fsx.mkdir(req.query.p, function (err) {
            if (err)
                res.status(500).end("Mkdir error: " + err);
            else
                res.end();
        });
    }
};

// Move (POST)
exports.mv = function (req, res) {
    if (!req.query.f)
        res.status(500).end("Argument error. Missing initial path name.");
    else if (!(req.query.t || req.query.n))
        res.status(500).end("Argument error. Missing target path name or new file name.");

    else {
        // This is for changing the base name of the target file.
        if (req.query.n) {
            var newname = path.join(path.dirname(req.query.f), req.query.n);
            console.log("New file path " + newname);
            fsx.move(req.query.f, newname, function (err) {
                console.log("File " + req.query.f + " was moved to " + newname);

                if (err)
                    res.status(500).end("Move error: " + err);
                else
                    res.end();
            });
        }
        // Direct path to path move.
        else if (req.query.t) {
            fsx.move(req.query.f, req.query.t, function (err) {
                if (err)
                    res.status(500).end("Move error: " + err);
                else
                    res.end();
            });
        }
    }
};