<<<<<<< HEAD
var fs = require('fs-extra');
var path = require('path');
function SteamUser(userId, steamerInstance) {
    this.userId = userId;
    this.steamerInstance = steamerInstance;
    this.directory = null;
    this.shortcutsFilePath = null;
    this.steamerInstance = null;
    this.initUser = function (userId, steamer) {
        this.directory = path.join(this.steamerInstance.steamDirectory, "userdata", this.userId);
        this.shortcutsFilePath = path.join(this.directory, "config", "shortcuts.vdf");
    }
}

module.exports = SteamUser;
=======
"use strict";
exports.__esModule = true;
var path = require("path");
var SteamUser = /** @class */ (function () {
    function SteamUser(userId, steamer) {
        this.userId = userId;
        this.steamerInstance = steamer;
        this.initUser();
    }
    // retrieve user files
    SteamUser.prototype.initUser = function () {
        this.directory = path.join(this.steamerInstance.steamDirectory, "userdata", this.userId);
        this.shortcutsFilePath = path.join(this.directory, "config", "shortcuts.vdf");
    };
    return SteamUser;
}());
exports.SteamUser = SteamUser;
>>>>>>> parent of b689592... //WIP JS rework
