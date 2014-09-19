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
var spawn = require("child_process").spawn;
var os = require("os");

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

app.set("env", process.env.ENV || "development");
app.set("port", process.env.PORT || 3000);
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
app.use(passport.initialize());
app.use(passport.session());
app.use(exStatic(path.join(__dirname, "public"), { index: false }));

// Development only
if ("development" == app.get("env"))
    app.use(exLogger("combined"));

var server = http.createServer(app);

passport.use(new LocalStrategy(
    function(username, password, done) {
        if (app.get("password") == password)
            return done(null, app.get("password"));
        else
            return done(null, false);
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

app.get("/",
    ensureAuthenticated,
    function (req, res) { res.redirect("/index"); });

// Static pages.
app.get("/index",
    ensureAuthenticated,
    function (req, res) { res.sendFile("public/index.html", { root: process.cwd() }); });
app.get("/apropos",
    ensureAuthenticated,
    function (req, res) { res.sendFile("public/apropos.html", { root: process.cwd() }); });

// Login
app.get("/login",
    function (req, res) { res.sendFile("public/login.html", { root: process.cwd() }); });
app.post("/login",
    passport.authenticate('local', { failureRedirect: "/login" }),
    function (req, res) {
        res.redirect("/index");
    });

// API
app.get("/fs/:part",
    ensureAuthenticated,
    fsroute.get);
app.get("/fsev",
    ensureAuthenticated,
    fsroute.event);
app.get("/dl",
    ensureAuthenticated,
    fsroute.dl);
app.post("/up",
    ensureAuthenticated,
    fsroute.up);

server.listen(app.get("port"), function() {});

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

