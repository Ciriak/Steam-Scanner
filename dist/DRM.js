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
var psList = require("ps-list");
var recursive = require("recursive-readdir");
var xml2js_1 = require("xml2js");
var SteamerHelpers_1 = require("./SteamerHelpers");
var helper = new SteamerHelpers_1.SteamerHelpers();
var parseXml = xml2js_1.parseString;
var DRM = /** @class */ (function () {
    function DRM(drmItem) {
        this.binaryPossibleLocations = [];
        this.gamesPossibleLocations = [];
        this.name = drmItem.name;
        this.binaryPossibleLocations = drmItem.binaryPossibleLocations;
        this.gamesPossibleLocations = drmItem.gamesPossibleLocations;
        this.binaryName = drmItem.binaryName;
        this.games = [];
    }
    DRM.prototype.checkInstallation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var parsedPossibleLocations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, helper.addDrivesToPossibleLocations(this.binaryPossibleLocations)];
                    case 1:
                        parsedPossibleLocations = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve) {
                                // first we locate steam directory
                                for (var _i = 0, parsedPossibleLocations_1 = parsedPossibleLocations; _i < parsedPossibleLocations_1.length; _i++) {
                                    var loc = parsedPossibleLocations_1[_i];
                                    loc = path.normalize(path.join(loc, _this.binaryName));
                                    // try to list all the users in the userdata folder of steam
                                    if (fs.existsSync(loc)) {
                                        _this.binaryLocation = loc;
                                        break;
                                    }
                                }
                                if (_this.binaryLocation) {
                                    _this.isAvailable = true;
                                    helper.log(_this.name + " located at " + _this.binaryLocation);
                                }
                                else {
                                    helper.log(_this.name + " not found");
                                }
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
                                        this.games.push({
                                            directory: currentGameDir
                                        });
                                    }
                                }
                                // skip if the possible game folder don't exist
                            }
                            catch (e) {
                                continue;
                            }
                        }
                        helper.log(this.games.length + " " + this.name + " game(s) found");
                        return [2 /*return*/, new Promise(function (resolve) {
                                resolve();
                            })];
                }
            });
        });
    };
    DRM.prototype.getGamesBinaries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var gameIndex, gameItem, filesList, binariesPathList, _i, filesList_1, fileName, processList, _a, processList_1, processItem, _b, binariesPathList_1, binaryPath, binary;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        gameIndex = 0;
                        _c.label = 1;
                    case 1:
                        if (!(gameIndex < this.games.length)) return [3 /*break*/, 5];
                        gameItem = this.games[gameIndex];
                        return [4 /*yield*/, recursive(gameItem.directory)];
                    case 2:
                        filesList = _c.sent();
                        binariesPathList = [];
                        for (_i = 0, filesList_1 = filesList; _i < filesList_1.length; _i++) {
                            fileName = filesList_1[_i];
                            if (fileName.search(".exe") > -1) {
                                binariesPathList.push(fileName);
                            }
                        }
                        // if there is only one binaries then its the game binary (will never happend lol)
                        if (binariesPathList.length === 1) {
                            this.games[gameIndex].binary = binariesPathList[0];
                            return [2 /*return*/, new Promise(function (resolve) {
                                    resolve();
                                })];
                        }
                        /*
                          Here, we will listen for an active process to have the same name than a binarie found in the game files
                        */
                        helper.log("Trying to find the process");
                        helper.log("retrieving process list...");
                        return [4 /*yield*/, psList({
                                all: false
                            })];
                    case 3:
                        processList = _c.sent();
                        helper.log(processList.length + " process found");
                        processListLoop: for (_a = 0, processList_1 = processList; _a < processList_1.length; _a++) {
                            processItem = processList_1[_a];
                            for (_b = 0, binariesPathList_1 = binariesPathList; _b < binariesPathList_1.length; _b++) {
                                binaryPath = binariesPathList_1[_b];
                                binary = path.parse(binaryPath);
                                if (processItem.name === binary.base) {
                                    // EXE FOUND !!!
                                    this.games[gameIndex].binaryPath = binaryPath;
                                    this.games[gameIndex].binary = binary.base;
                                    break processListLoop;
                                }
                            }
                        }
                        _c.label = 4;
                    case 4:
                        gameIndex++;
                        return [3 /*break*/, 1];
                    case 5:
                        console.log(this.games);
                        return [2 /*return*/, new Promise(function (resolve) {
                                resolve();
                            })];
                }
            });
        });
    };
    return DRM;
}());
exports.DRM = DRM;
