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
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var http = require("http");
var path = require("path");
var WebSocket = require("ws").Server;
var busboy = require("express-busboy");
var flash = require("connect-flash");
var eventSource = require("event-source-emitter");
var os = require("os");
var fs = require("fs");
var jargvy = require('jargvy');
var asock = require("./abstract_socket.js");

// Express application
var app = express();

busboy.extend(app, {
    upload: true,
    path: os.platform() == "android" ? "/data/local/tmp" : os.tmpdir()
});

function ensureAuthenticated(req, res, next) {
    if ("development" == app.get("env"))
        return next();

    if (req.isAuthenticated())
        return next();

    res.redirect('/login');
}

// Routes;
var fsroute = require("./routes/fs");

var rules = [
    { "id": "-p", "name": "port", "default": "3000" },
    { "id": "-e", "name": "environment", "default": "development" },
    { "id": "-s", "name": "socket", "default": null }
];
jargvy.define(rules);
var options = jargvy.extract();

app.set("env", options.environment);
app.set("port", options.port);
app.set("socket", options.socket);
app.set("views", path.join(__dirname, "views"));

// Middlewares.
app.use(exSession({ secret: 'la grippe' }));
app.use(function (req, res, next) {
    // Don't allow direct requests for .html files.
    if (/\.html$/.test(req.path))
        res.redirect("/");
    else
        next();
});

// Authentication.
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Static files.
app.use(exStatic(path.join(__dirname, "public"), { index: false, redirect: false }));

// Logging: enabled in development only
if ("development" == app.get("env"))
    app.use(exLogger("combined"));

var server = http.createServer(app);

passport.use(new LocalStrategy(
    function(username, password, done) {
        if (app.get("password") == password)
            return done(null, app.get("password"));
        else {
            return done(null, false, { message: "Invalid password" });
        }
    })
);

passport.serializeUser(function(pass, done) {
    done(null, pass);
});

passport.deserializeUser(function(pass, done) {
    if (pass != app.get("password"))
        done("Failed to deserialize session");
    else
        done(null, pass);
});

//
// Routes configuration.
//

app.get("/", ensureAuthenticated, function (req, res) { res.redirect("/index"); });

// Static pages.
app.get("/index",
    ensureAuthenticated,
    function (req, res) { res.sendFile("public/index.html", { root: process.cwd() }); });
app.get("/apropos",
    ensureAuthenticated,
    function (req, res) { res.sendFile("public/apropos.html", { root: process.cwd() }); });

// Login
app.get("/login",
    function (req, res) {
        res.cookie("error", req.flash("error"));
        res.sendFile("public/login.html", { root: process.cwd() });
    }
);
app.post("/login",
    passport.authenticate('local', { failureRedirect: "/login", failureFlash: true }),
    function (req, res) {
        res.redirect("/index");
    });

// API
app.get("/fs/:part", ensureAuthenticated, fsroute.get);
app.get("/fsev", ensureAuthenticated, fsroute.event);
app.get("/dl", ensureAuthenticated, fsroute.dl);
app.post("/up", ensureAuthenticated, fsroute.up);
app.post("/rm", ensureAuthenticated, fsroute.rm);
app.post("/mv", ensureAuthenticated, fsroute.mv);
app.post("/mkdir", ensureAuthenticated, fsroute.mkdir);

// Keep-alive. This event source will be enabled for the lifetime of the server process.
app.get("/ka", function (req, res) {
    eventSource(req, res, { keepAlive: true });
});

process.stdout.on("close", function () {
    process.exit();
});

// This is the "keepalive" socket. The app front end opens a LocalServerSocket on which
// the web front end can connect. Once the web front end is connected, killing the front
// end app will close the socket and this code ensure the backend will exit once that happens.
if (app.get("socket")) {
    var kasock;

    try {
        kasock = asock.connect('\0' + app.get("socket"), function () {
            console.log("Connected to keepalive socket...");
        });

        kasock.on("end", function () {
            console.log("Lost keepalive socket...");
            process.exit(1);
        });

    } catch (ex) {
        console.log("Connection to keepalive socket failed:", ex);
        process.exit(1);
    }
}

// Try to listen on the default port..
server.listen(app.get("port"), function () {});

// Handle receiving the "quit" command from the UI.
process.stdin.on("data", function (chunk) {
    var cmd, params, cs;

    cs = chunk.toString().split("\n")[0].trim().split(" ");

    cmd = cs.shift().toLowerCase();
    params = cs;

    if (cmd == "quit")
        process.exit();
    else if (cmd == "pass")
        app.set("password", params[0]);
    else
        console.log("Unknown command: " + cmd)
});

