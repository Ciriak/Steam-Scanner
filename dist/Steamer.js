"use strict";
exports.__esModule = true;
var fs = require("fs-extra");
var path = require("path");
var possibleSteamLocations = [
    "C:\\Program Files (x86)\\Steam"
];
var shortcutsConfigPath = "userdata\\%user%\\config\\shortcuts.vdf";
var Steamer = /** @class */ (function () {
    function Steamer() {
        this.checkSteamInstallation();
    }
    /**
     * Report error
     */
    Steamer.prototype.error = function (err) {
        console.error(err);
    };
    /**
     * Report log
     */
    Steamer.prototype.log = function (msg) {
        console.log(msg);
    };
    /**
     * Check if steam is installed
     */
    Steamer.prototype.checkSteamInstallation = function () {
        // first we locate steam directory
        for (var _i = 0, possibleSteamLocations_1 = possibleSteamLocations; _i < possibleSteamLocations_1.length; _i++) {
            var loc = possibleSteamLocations_1[_i];
            // try to list all the users in the userdata folder of steam
            try {
                var dir = path.join(loc, "userdata");
                fs.readdirSync(dir);
                this.steamDirectory = dir.replace("userdata", "");
            }
            catch (e) {
                continue;
            }
        }
        if (!this.steamDirectory) {
            this.error("ERR_STEAM_NOT_FOUND");
            return;
        }
        this.log("Steam directory located at " + this.steamDirectory);
        this.log("Looking for steam accounts...");
        var userDirectories = [];
        var usersDir = path.join(this.steamDirectory, "userdata");
        var items = fs.readdirSync(usersDir);
        for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
            var dir = items_1[_a];
            var dirPath = path.join(usersDir, dir);
            try {
                if (fs.lstatSync(dirPath).isDirectory()) {
                    userDirectories.push(dirPath);
                }
            }
            catch (e) {
                this.error(e);
                continue;
            }
        }
        this.log(userDirectories.length + " user(s) found");
    };
    Steamer.prototype.generateShortcutFilesList = function () {
        return ["dd"];
    };
    return Steamer;
}());
exports.Steamer = Steamer;
