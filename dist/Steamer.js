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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
        this.init();
    }
    Steamer.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkSteamInstallation()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.updateGames()];
                    case 2:
                        _a.sent();
                        console.log("Init done !");
                        return [2 /*return*/];
                }
            });
        });
    };
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
    Steamer.prototype.addDrivesToPossibleLocations = function (possibleLocations) {
        return new Promise(function (resolve) {
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
                resolve(parsedPossibleLocations);
            });
        });
    };
    /**
     * Check if steam is installed
     */
    Steamer.prototype.checkSteamInstallation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var parsedPossibleSteamLocations, _i, parsedPossibleSteamLocations_1, loc, dir, userDirectories, usersDir, items, _a, items_1, dir, dirPath, _b, userDirectories_1, userDir, userId, user;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.addDrivesToPossibleLocations(possibleSteamLocations)];
                    case 1:
                        parsedPossibleSteamLocations = _c.sent();
                        // first we locate steam directory
                        for (_i = 0, parsedPossibleSteamLocations_1 = parsedPossibleSteamLocations; _i < parsedPossibleSteamLocations_1.length; _i++) {
                            loc = parsedPossibleSteamLocations_1[_i];
                            // try to list all the users in the userdata folder of steam
                            try {
                                dir = path.join(loc, "userdata");
                                fs.readdirSync(dir);
                                this.steamDirectory = dir.replace("userdata", "");
                            }
                            catch (e) {
                                continue;
                            }
                        }
                        if (!this.steamDirectory) {
                            this.error("ERR_STEAM_NOT_FOUND");
                            return [2 /*return*/];
                        }
                        this.log("Steam directory located at " + this.steamDirectory);
                        this.log("Looking for steam accounts...");
                        userDirectories = [];
                        usersDir = path.join(this.steamDirectory, "userdata");
                        items = fs.readdirSync(usersDir);
                        // only keep the directories
                        for (_a = 0, items_1 = items; _a < items_1.length; _a++) {
                            dir = items_1[_a];
                            dirPath = path.join(usersDir, dir);
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
                        for (_b = 0, userDirectories_1 = userDirectories; _b < userDirectories_1.length; _b++) {
                            userDir = userDirectories_1[_b];
                            userId = path.basename(userDir);
                            user = new SteamUser_1.SteamUser(userId, this);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return Steamer;
}());
exports.Steamer = Steamer;
>>>>>>> parent of b689592... //WIP JS rework
