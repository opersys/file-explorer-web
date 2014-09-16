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

var express = require("express");
var exSession = require("express-session");
var exLogger = require("morgan");
var exStatic = require("serve-static");
var http = require("http");
var path = require("path");
var WebSocket = require("ws").Server;
var busboy = require("express-busboy");
var spawn = require("child_process").spawn;
var os = require("os");

// Express application
var app = express();
busboy.extend(app, {
    upload: true,
    path: os.platform() == "android" ? "/data/local/tmp" : os.tmpdir()
});

// Routes;
var fsroute = require("./routes/fs");

app.set("env", process.env.ENV || "development");
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));

// Middlewares.
app.use(exSession({ secret: 'la grippe' }));
app.use(exStatic(path.join(__dirname, "public")));

// development only
if ("development" == app.get("env"))
    app.use(exLogger("combined"));

var server = http.createServer(app);

app.get("/", function (req, res) { res.redirect("/index.html"); });
app.get("/apropos", function (req, res) { res.redirect("/apropos.html"); });
app.get("/fs/:part", fsroute.get);
app.get("/fsev", fsroute.event);
app.get("/dl", fsroute.dl);
app.post("/up", fsroute.up);

server.listen(app.get('port'), function() {});

// Handle receiving the "quit" command from the UI.
process.stdin.on("data", function (chunk) {
    if (chunk.toString().split("\n")[0].trim().toLowerCase() == "quit")
        process.exit();
});

