<<<<<<< HEAD
const fs = require("fs-extra");
const path = require("path");
const drivelist = require("drivelist");
const SteamUser = require("./SteamUser.js");
const DRMManager = require("./DRMManager.js");

const possibleSteamLocations = [
  "$drive\\Program Files (x86)\\Steam",
  "$drive\\Programmes\\Steam"
];

function Steamer() {
  this.steamDirectory = null;
  this.DRMManager = new DRMManager(this);
  this.DRMManager.getAllGames(this);

  this.log = function(msg) {
    console.log(msg);
  };
  this.error = function(msg) {
    console.error(msg);
  };

  /**
   * Check if steam is installed
   */
  this.checkSteamInstallation = function(steamerInstance) {
    this.addDrivesToPossibleLocations(possibleSteamLocations, function(
      parsedPossibleSteamLocations
    ) {
      // first we locate steam directory
      for (const loc of parsedPossibleSteamLocations) {
        // try to list all the users in the userdata folder of steam
        try {
          const dir = path.join(loc, "userdata");
          fs.readdirSync(dir);
          this.steamDirectory = dir.replace("userdata", "");
        } catch (e) {
          continue;
        }
      }
      if (!this.steamDirectory) {
        this.error("ERR_STEAM_NOT_FOUND");
        return;
      }

      steamerInstance.log(`Steam directory located at ${this.steamDirectory}`);
      steamerInstance.log("Looking for steam accounts...");

      const userDirectories = [];
      const usersDir = path.join(this.steamDirectory, "userdata");
      const items = fs.readdirSync(usersDir);

      // only keep the directories
      for (const dir of items) {
        const dirPath = path.join(usersDir, dir);
        try {
          if (fs.lstatSync(dirPath).isDirectory()) {
            userDirectories.push(dirPath);
          }
        } catch (e) {
          this.error(e);
          continue;
        }
      }

      steamerInstance.log(`${userDirectories.length} user(s) found`);

      for (const userDir of userDirectories) {
        const userId = path.basename(userDir);
        const user = new SteamUser(userId, this);
      }
    });
  };

  /**
   * Take a list of possible location and extend it to all drive available on the machine
   * return the same object with more propertyes
   * $drive is replaced
   */
  this.addDrivesToPossibleLocations = function(possibleLocations, callback) {
    let mountPoints = [];
    const parsedPossibleLocations = [];
    drivelist.list(function(err, drives) {
      for (const drive of drives) {
        for (const mountPoint of drive.mountpoints) {
          mountPoints.push(mountPoint.path);
        }
      }

      for (const mountPoint of mountPoints) {
        for (const loc of possibleLocations) {
          parsedPossibleLocations.push(
            path.normalize(loc.replace("$drive", mountPoint))
          );
        }
      }

      return callback(parsedPossibleLocations);
    });
  };

  this.checkSteamInstallation(this);
}

module.exports = Steamer;
=======
"use strict";
exports.__esModule = true;
var fs = require("fs-extra");
var path = require("path");
var drivelist = require("drivelist");
var DRMManager_1 = require("./DRMManager");
var SteamUser_1 = require("./SteamUser");
var possibleSteamLocations = [
    "$drive\\Program Files (x86)\\Steam",
    "$drive\\Programmes\\Steam"
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
     * Scan for Installed DRM and add them to steam
     */
    Steamer.prototype.updateGames = function () {
        var drmManager = new DRMManager_1.DRMManager(this);
        this.externalGames = drmManager.getAllGames();
    };
    /**
     * Take a list of possible location and extend it to all drive available on the machine
     * return the same object with more propertyes
     * $drive is replaced
     */
    Steamer.prototype.addDrivesToPossibleLocations = function (possibleLocations, callback) {
        var mountPoints = [];
        var parsedPossibleLocations = [];
        drivelist.list(function (error, drives) {
            for (var _i = 0, drives_1 = drives; _i < drives_1.length; _i++) {
                var drive = drives_1[_i];
                for (var _a = 0, _b = drive.mountpoints; _a < _b.length; _a++) {
                    var mountPoint = _b[_a];
                    mountPoints.push(mountPoint.path);
                }
            }
            for (var _c = 0, mountPoints_1 = mountPoints; _c < mountPoints_1.length; _c++) {
                var mountPoint = mountPoints_1[_c];
                for (var _d = 0, possibleLocations_1 = possibleLocations; _d < possibleLocations_1.length; _d++) {
                    var loc = possibleLocations_1[_d];
                    parsedPossibleLocations.push(path.normalize(loc.replace("$drive", mountPoint)));
                }
            }
            callback(parsedPossibleLocations);
        });
    };
    /**
     * Check if steam is installed
     */
    Steamer.prototype.checkSteamInstallation = function () {
        var _this = this;
        this.addDrivesToPossibleLocations(possibleSteamLocations, function (parsedPossibleSteamLocations) {
            // first we locate steam directory
            for (var _i = 0, parsedPossibleSteamLocations_1 = parsedPossibleSteamLocations; _i < parsedPossibleSteamLocations_1.length; _i++) {
                var loc = parsedPossibleSteamLocations_1[_i];
                // try to list all the users in the userdata folder of steam
                try {
                    var dir = path.join(loc, "userdata");
                    fs.readdirSync(dir);
                    _this.steamDirectory = dir.replace("userdata", "");
                }
                catch (e) {
                    continue;
                }
            }
            if (!_this.steamDirectory) {
                _this.error("ERR_STEAM_NOT_FOUND");
                return;
            }
            _this.log("Steam directory located at " + _this.steamDirectory);
            _this.log("Looking for steam accounts...");
            var userDirectories = [];
            var usersDir = path.join(_this.steamDirectory, "userdata");
            var items = fs.readdirSync(usersDir);
            // only keep the directories
            for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
                var dir = items_1[_a];
                var dirPath = path.join(usersDir, dir);
                try {
                    if (fs.lstatSync(dirPath).isDirectory()) {
                        userDirectories.push(dirPath);
                    }
                }
                catch (e) {
                    _this.error(e);
                    continue;
                }
            }
            _this.log(userDirectories.length + " user(s) found");
            for (var _b = 0, userDirectories_1 = userDirectories; _b < userDirectories_1.length; _b++) {
                var userDir = userDirectories_1[_b];
                var userId = path.basename(userDir);
                var user = new SteamUser_1.SteamUser(userId, _this);
            }
        });
    };
    return Steamer;
}());
exports.Steamer = Steamer;
>>>>>>> parent of b689592... //WIP JS rework
