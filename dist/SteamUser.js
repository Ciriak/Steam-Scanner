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
var _ = require("lodash");
var notifier = require("node-notifier");
var path = require("path");
var shortcut = require("steam-shortcut-editor");
var SteamerHelpers_1 = require("./SteamerHelpers");
var helper = new SteamerHelpers_1.SteamerHelpers();
var SteamUser = /** @class */ (function () {
    function SteamUser(userId, steamer) {
        this.userId = userId;
        this.steamerInstance = steamer;
        this.initUser();
    }
    // isFirstInstance : used in case of multiple users, only the first instance send log and notifications
    // this prevent spam (ex : 6 notification because there is 6 steam accounts)
    SteamUser.prototype.updateShortcuts = function (isFirstInstance) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var addedShortcuts = 0;
                        shortcut.parseFile(_this.shortcutsFilePath, function (err, shortcutData) {
                            // if can't parse (ex: shortcut file don't exist) , create a clean object
                            if (err || !shortcutData || !shortcutData.shortcuts) {
                                shortcutData = {
                                    shortcuts: []
                                };
                            }
                            var drmList = helper.getConfig("drm");
                            for (var drmName in drmList) {
                                if (drmList.hasOwnProperty(drmName)) {
                                    var drm = drmList[drmName];
                                    for (var gameName in drm.games) {
                                        if (drm.games.hasOwnProperty(gameName)) {
                                            var game = drm.games[gameName];
                                            // skip if the binary of the game in unknown
                                            if (!game.binary) {
                                                continue;
                                            }
                                            // check if the game is already in the steam shortcuts
                                            var gameShortcutIndex = _.findIndex(shortcutData.shortcuts, {
                                                exe: game.binary
                                            });
                                            // skip this game
                                            if (gameShortcutIndex > -1) {
                                                continue;
                                            }
                                            if (isFirstInstance) {
                                                var enableNotifications = helper.getConfig("enableNotifications");
                                                helper.log("Added a shortcut for " + game.name);
                                                if (enableNotifications) {
                                                    notifier.notify({
                                                        title: game.name,
                                                        message: "This game has been added to your game library, please restart Steam"
                                                    });
                                                }
                                            }
                                            shortcutData.shortcuts.push({
                                                exe: game.binary,
                                                tags: [drm.name],
                                                appName: game.name,
                                                StartDir: game.directory
                                            });
                                            addedShortcuts++;
                                        }
                                    }
                                }
                            }
                            shortcut.writeFile(_this.shortcutsFilePath, shortcutData, function (errW) {
                                if (errW) {
                                    helper.error(errW);
                                    return resolve();
                                }
                            });
                            if (addedShortcuts > 0 && isFirstInstance) {
                                helper.log(addedShortcuts + " shortcut(s) added, Steam restart required !");
                            }
                            return resolve();
                        });
                        return resolve();
                    })];
            });
        });
    };
    // retrieve user files
    SteamUser.prototype.initUser = function () {
        this.directory = path.join(this.steamerInstance.steamDirectory, "userdata", this.userId);
        this.shortcutsFilePath = path.join(this.directory, "config", "shortcuts.vdf");
    };
    return SteamUser;
}());
exports.SteamUser = SteamUser;
