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
var recursive = require("recursive-readdir");
var SteamerHelpers_1 = require("./SteamerHelpers");
var helper = new SteamerHelpers_1.SteamerHelpers();
var DRM = /** @class */ (function () {
    function DRM(drmItem) {
        this.binaryPossibleLocations = [];
        this.gamesPossibleLocations = [];
        this.name = drmItem.name;
        this.binaryPossibleLocations = drmItem.binaryPossibleLocations;
        this.gamesPossibleLocations = drmItem.gamesPossibleLocations;
        this.binaryName = drmItem.binaryName;
        this.games = {};
    }
    DRM.prototype.checkInstallation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var drmConfig, parsedPossibleLocations, _i, parsedPossibleLocations_1, loc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        drmConfig = helper.getConfig("drm." + this.name);
                        if (!(!drmConfig || !drmConfig.binaryLocation)) return [3 /*break*/, 2];
                        return [4 /*yield*/, helper.addDrivesToPossibleLocations(this.binaryPossibleLocations)];
                    case 1:
                        parsedPossibleLocations = _a.sent();
                        // first we locate the drm directory
                        for (_i = 0, parsedPossibleLocations_1 = parsedPossibleLocations; _i < parsedPossibleLocations_1.length; _i++) {
                            loc = parsedPossibleLocations_1[_i];
                            loc = path.normalize(path.join(loc, this.binaryName));
                            // try to list all the users in the userdata folder of steam
                            if (fs.existsSync(loc)) {
                                this.binaryLocation = loc;
                                break;
                            }
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        this.binaryLocation = drmConfig.binaryLocation;
                        _a.label = 3;
                    case 3:
                        if (this.binaryLocation) {
                            helper.log(this.name + " located at " + this.binaryLocation);
                            helper.setConfig("drm." + this.name, this);
                        }
                        else {
                            helper.log(this.name + " not found");
                        }
                        return [2 /*return*/, new Promise(function (resolve) {
                                resolve();
                            })];
                }
            });
        });
    };
    DRM.prototype.getGames = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getGamesDirectories()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getGamesBinaries()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, new Promise(function (resolve) {
                                resolve();
                            })];
                }
            });
        });
    };
    // use the found games directories
    DRM.prototype.getGamesDirectories = function () {
        return __awaiter(this, void 0, void 0, function () {
            var parsedGamesPossibleLocations, _i, parsedGamesPossibleLocations_1, gamesPossibleLocation, items, _a, items_1, dir, currentGameDir;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, helper.addDrivesToPossibleLocations(this.gamesPossibleLocations)];
                    case 1:
                        parsedGamesPossibleLocations = _b.sent();
                        for (_i = 0, parsedGamesPossibleLocations_1 = parsedGamesPossibleLocations; _i < parsedGamesPossibleLocations_1.length; _i++) {
                            gamesPossibleLocation = parsedGamesPossibleLocations_1[_i];
                            try {
                                items = fs.readdirSync(gamesPossibleLocation);
                                // only keep the directories
                                for (_a = 0, items_1 = items; _a < items_1.length; _a++) {
                                    dir = items_1[_a];
                                    currentGameDir = path.normalize(path.join(gamesPossibleLocation, dir));
                                    if (fs.lstatSync(currentGameDir).isDirectory()) {
                                        this.games[dir] = { directory: currentGameDir };
                                    }
                                }
                                // skip if the possible game folder don't exist
                            }
                            catch (e) {
                                continue;
                            }
                        }
                        return [2 /*return*/, new Promise(function (resolve) {
                                resolve();
                            })];
                }
            });
        });
    };
    DRM.prototype.getGamesBinaries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _i, gameName, gameItem, parsedGamepath, gameConfig, filesList, binariesPathList, _c, filesList_1, fileName;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = [];
                        for (_b in this.games)
                            _a.push(_b);
                        _i = 0;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        gameName = _a[_i];
                        if (!this.games.hasOwnProperty(gameName)) return [3 /*break*/, 3];
                        gameItem = this.games[gameName];
                        parsedGamepath = path.parse(gameItem.directory);
                        gameItem.name = parsedGamepath.name;
                        gameConfig = helper.getConfig("drm." + this.name + ".games." + gameName);
                        // if game and his binary are already known => skip
                        if (gameConfig && gameConfig.binary) {
                            return [3 /*break*/, 3];
                        }
                        return [4 /*yield*/, recursive(gameItem.directory)];
                    case 2:
                        filesList = _d.sent();
                        binariesPathList = [];
                        for (_c = 0, filesList_1 = filesList; _c < filesList_1.length; _c++) {
                            fileName = filesList_1[_c];
                            if (fileName.search(".exe") > -1) {
                                binariesPathList.push(fileName);
                            }
                        }
                        // if there is only one binaries then its the game binary (will never happend lol)
                        if (binariesPathList.length === 1) {
                            this.games[gameName].binary = binariesPathList[0];
                            helper.setConfig("drm." + this.name + ".games." + gameItem.name, gameItem);
                            return [3 /*break*/, 3];
                        }
                        if (binariesPathList.length > 1) {
                            helper.setConfig("drm." + this.name + ".games." + gameItem.name, gameItem);
                            /*
                            Here, we will listen for an active process to have the same name than a binarie found in the game files
                            add the game the the listener, things hapened in "Steamer.ts"
                          */
                            helper.log("Trying to find the process for " + gameItem.name);
                            helper.setConfig("drm." + this.name + ".games." + gameItem.name + ".listenedBinaries", binariesPathList);
                        }
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, new Promise(function (resolve) {
                            resolve();
                        })];
                }
            });
        });
    };
    return DRM;
}());
exports.DRM = DRM;
