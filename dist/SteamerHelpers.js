"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var fs = require("fs-extra");
var path = require("path");
var drivelist = require("drivelist");
var configPath = path.normalize(path.join(electron_1.app.getPath("appData"), "Steamer", "config.json"));
var SteamerHelpers = /** @class */ (function () {
    function SteamerHelpers() {
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
        parsedPath = givenPath.replace(occurences[0], // %appdata%
        electron_1.app.getPath(isolatedOccurence) // appdata
        );
        parsedPath = path.normalize(parsedPath);
        return parsedPath;
    };
    // retrieve a propertie into the config
    SteamerHelpers.prototype.getConfig = function (key) {
        try {
            // be sure that the file exist
            fs.ensureFileSync(configPath);
            var configData = fs.readJsonSync(configPath)[key];
            return configData;
        }
        catch (e) {
            this.error(e);
            return false;
        }
    };
    // save a propertie into the config
    SteamerHelpers.prototype.setConfig = function (key, value) {
        var configData;
        try {
            // be sure that the file exist
            fs.ensureFileSync(configPath);
            configData = fs.readJsonSync(configPath);
        }
        catch (e) {
            configData = {};
        }
        configData[key] = value;
        try {
            fs.writeJsonSync(configPath, configData);
            return value;
        }
        catch (e) {
            this.error(e);
            return false;
        }
    };
    return SteamerHelpers;
}());
exports.SteamerHelpers = SteamerHelpers;
