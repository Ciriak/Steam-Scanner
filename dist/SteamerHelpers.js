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
var electron_1 = require("electron");
var fs = require("fs-extra");
var objectPath = require("object-path");
var path = require("path");
var drivelist = require("drivelist");
var isDev = require("electron-is-dev");
var colors = require("colors");
var autoLaunch = require("auto-launch");
var configPath = path.normalize(path.join(electron_1.app.getPath("appData"), "Steamer", "config.json"));
var cleanConfig = {
    steamDirectory: null,
    drm: {},
    launchOnStartup: true,
    enableNotifications: true
};
var SteamerHelpers = /** @class */ (function () {
    function SteamerHelpers() {
        this.isDev = isDev;
    }
    /**
     * Report error
     */
    SteamerHelpers.prototype.error = function (err) {
        console.error(err);
    };
    /**
     * Report log
     */
    SteamerHelpers.prototype.log = function (msg) {
        console.log(msg);
    };
    /**
     * Take a list of possible location and extend it to all drive available on the machine
     * return the same object with more propertyes
     * $drive is replaced
     */
    SteamerHelpers.prototype.addDrivesToPossibleLocations = function (possibleLocations) {
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
    SteamerHelpers.prototype.parseFilePath = function (givenPath) {
        var parsedPath;
        var regex = /%.*?%/;
        var occurences = givenPath.match(regex);
        var isolatedOccurence = occurences[0].replace(/%/g, "");
        parsedPath = givenPath.replace(occurences[0], electron_1.app.getPath(isolatedOccurence)); // %appdata% // appdata
        parsedPath = path.normalize(parsedPath);
        return parsedPath;
    };
    // retrieve a propertie into the config
    // key can be an object path
    SteamerHelpers.prototype.getConfig = function (key) {
        try {
            // be sure that the file exist
            fs.ensureFileSync(configPath);
            var configData = fs.readJsonSync(configPath);
            var parsedKey = key.split(".");
            var configDataTarget = objectPath.get(configData, parsedKey);
            return configDataTarget;
        }
        catch (e) {
            this.error(colors.red(e));
            return false;
        }
    };
    // save a propertie into the config
    SteamerHelpers.prototype.setConfig = function (key, value) {
        var configData;
        var parsedKey = key.split(".");
        try {
            // be sure that the file exist
            fs.ensureFileSync(configPath);
            configData = fs.readJsonSync(configPath);
        }
        catch (e) {
            // create a clean config file if don't exist or is corrupted
            this.log(colors.red("ERROR - corrupted or invalid config file - creating a clean config file..."));
            configData = this.getCleanConfig();
        }
        objectPath.ensureExists(configData, parsedKey, value);
        objectPath.set(configData, parsedKey, value);
        try {
            fs.writeJsonSync(configPath, configData);
        }
        catch (e) {
            this.error(colors.red(e));
            return false;
        }
        return value;
    };
    SteamerHelpers.prototype.checkArgv = function (steamerInstance) {
        return __awaiter(this, void 0, void 0, function () {
            var argv;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        argv = process.argv;
                        if (!(argv.indexOf("--clean") > -1)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.clean(steamerInstance)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, new Promise(function (resolve) {
                            resolve();
                        })];
                }
            });
        });
    };
    // reset shortcuts & config
    SteamerHelpers.prototype.clean = function (steamerInstance) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, steamUser;
            return __generator(this, function (_b) {
                // remove the shortcut file for each user
                for (_i = 0, _a = steamerInstance.steamUsers; _i < _a.length; _i++) {
                    steamUser = _a[_i];
                    try {
                        fs.removeSync(steamUser.shortcutsFilePath);
                    }
                    catch (e) {
                        continue;
                    }
                }
                try {
                    fs.removeSync(configPath);
                }
                catch (e) {
                    this.error(colors.red(e));
                }
                this.log(colors.green("=== Config and shortcuts cleaned ==="));
                return [2 /*return*/, new Promise(function (resolve) {
                        resolve();
                    })];
            });
        });
    };
    SteamerHelpers.prototype.toggleLaunchOnStartup = function () {
        var launcher = new autoLaunch({ name: "Steamer" });
        var launch = this.getConfig("launchOnStartup");
        if (isDev) {
            this.log(colors.yellow("NOTICE : Dev build, launch on startup ignored"));
            return;
        }
        if (launch) {
            launcher.disable();
        }
        else {
            launcher.enable();
        }
        this.setConfig("launchOnStartup", !launch);
        if (!launch === true) {
            this.log("Enabled launch on startup");
        }
        else {
            this.log("Disabled launch on startup");
        }
    };
    SteamerHelpers.prototype.toggleNotifications = function () {
        var notif = this.getConfig("enableNotifications");
        this.setConfig("enableNotifications", !notif);
        if (!notif === true) {
            this.log("Enabled notifications");
        }
        else {
            this.log("Disabled notifications");
        }
    };
    // close the app
    SteamerHelpers.prototype.quitApp = function () {
        electron_1.app.quit();
    };
    SteamerHelpers.prototype.getCleanConfig = function () {
        return cleanConfig;
    };
    return SteamerHelpers;
}());
exports.SteamerHelpers = SteamerHelpers;
