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
var DRMManager_1 = require("./DRMManager");
var SteamerHelpers_1 = require("./SteamerHelpers");
var SteamUser_1 = require("./SteamUser");
var possibleSteamLocations = [
    "$drive\\Program Files (x86)\\Steam",
    "$drive\\Programmes\\Steam"
];
var shortcutsConfigPath = "userdata\\%user%\\config\\shortcuts.vdf";
var helper = new SteamerHelpers_1.SteamerHelpers();
var drmManager = new DRMManager_1.DRMManager();
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
                        return [2 /*return*/, new Promise(function (resolve) {
                                console.log("Init done !");
                                resolve();
                            })];
                }
            });
        });
    };
    /**
     * Scan for Installed DRM and add them to steam
     */
    Steamer.prototype.updateGames = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, drmManager.getAllGames()];
                    case 1:
                        _a.externalGames = _b.sent();
                        return [2 /*return*/, new Promise(function (resolve) {
                                resolve();
                            })];
                }
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
                    case 0:
                        helper.log("Checking Steam location...");
                        // try to get steam directory from the config
                        this.steamDirectory = helper.getConfig("steamDirectory");
                        if (!!this.steamDirectory) return [3 /*break*/, 2];
                        return [4 /*yield*/, helper.addDrivesToPossibleLocations(possibleSteamLocations)];
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
                            helper.error("ERR_STEAM_NOT_FOUND");
                            return [2 /*return*/];
                        }
                        _c.label = 2;
                    case 2:
                        helper.log("Steam directory located at " + this.steamDirectory);
                        // save steam location
                        helper.setConfig("steamDirectory", this.steamDirectory);
                        helper.log("Looking for steam accounts...");
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
                                helper.error(e);
                                continue;
                            }
                        }
                        helper.log(userDirectories.length + " user(s) found");
                        for (_b = 0, userDirectories_1 = userDirectories; _b < userDirectories_1.length; _b++) {
                            userDir = userDirectories_1[_b];
                            userId = path.basename(userDir);
                            user = new SteamUser_1.SteamUser(userId, this);
                        }
                        return [2 /*return*/, new Promise(function (resolve) {
                                resolve();
                            })];
                }
            });
        });
    };
    /* A listener that try to find missing binaries for detected games
      We have a list of binaries found in the games directories
      When a active process correspond to one of the game binaries, then it is considered as the game main binarie
    */
    Steamer.prototype.binariesListener = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    return Steamer;
}());
exports.Steamer = Steamer;
