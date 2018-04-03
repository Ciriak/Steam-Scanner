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
var yaml = require("js-yaml");
var objectPath = require("object-path");
var path = require("path");
var xml2js_1 = require("xml2js");
var SteamerHelpers_1 = require("./SteamerHelpers");
var helper = new SteamerHelpers_1.SteamerHelpers();
var parseXml = xml2js_1.parseString;
var DRM = /** @class */ (function () {
    function DRM(drmItem) {
        this.exePossibleLocations = [];
        this.name = drmItem.name;
        this.exePossibleLocations = drmItem.exePossibleLocations;
        this.configProperties = drmItem.configProperties;
        this.configPath = helper.parseFilePath(this.configProperties.configFilePath);
    }
    DRM.prototype.checkInstallation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var parsedPossibleLocations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, helper.addDrivesToPossibleLocations(this.exePossibleLocations)];
                    case 1:
                        parsedPossibleLocations = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve) {
                                // first we locate steam directory
                                for (var _i = 0, parsedPossibleLocations_1 = parsedPossibleLocations; _i < parsedPossibleLocations_1.length; _i++) {
                                    var loc = parsedPossibleLocations_1[_i];
                                    // try to list all the users in the userdata folder of steam
                                    if (fs.existsSync(loc)) {
                                        _this.exeLocation = loc;
                                        break;
                                    }
                                }
                                if (_this.exeLocation) {
                                    _this.isAvailable = true;
                                    helper.log(_this.name + " located at " + _this.exeLocation);
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
                    case 0:
                        if (!!this.gamesDirectory) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getGamesDirectory()];
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
    DRM.prototype.getGamesDirectory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configData, propertieAccess, configFileType, drmRef, _a, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        propertieAccess = this.configProperties.gamesPathPropertieAccess;
                        configFileType = path.extname(this.configPath).replace(".", "");
                        drmRef = this;
                        try {
                            configData = fs.readFileSync(this.configPath, "utf-8");
                        }
                        catch (e) {
                            helper.error(e);
                        }
                        _a = configFileType;
                        switch (_a) {
                            case "xml": return [3 /*break*/, 1];
                            case "yml": return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 4];
                    case 1: return [4 /*yield*/, parseXml(configData, function (err, result) {
                            if (err) {
                                helper.error(err);
                            }
                            drmRef.gamesDirectory = objectPath.get(result, propertieAccess);
                        })];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        try {
                            result = yaml.safeLoad(configData);
                            drmRef.gamesDirectory = objectPath.get(result, propertieAccess);
                            console.log(drmRef.gamesDirectory);
                        }
                        catch (e) {
                            helper.error(e);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        helper.error("[" + this.name + "] ERR_INVALID_CONFIG_EXT");
                        _b.label = 5;
                    case 5:
                        if (!drmRef.gamesDirectory) {
                            helper.error("[" + this.name + "] ERR_INVALID_CONFIG_PROPERTIE_PATH");
                        }
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
