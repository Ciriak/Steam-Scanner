"use strict";
exports.__esModule = true;
var drmList = {
    uplay: {
        possibleLocations: [
            "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\UbisoftGameLauncher.exe",
            "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher\\UbisoftGameLauncher.exe"
        ]
    }
};
var DRMManager = /** @class */ (function () {
    function DRMManager(steamerInstance) {
        this.steamerInstance = steamerInstance;
    }
    /**
     * Return a list of all found game (other than steam)
     */
    DRMManager.prototype.getAllGames = function () {
        console.log("test");
    };
    return DRMManager;
}());
exports.DRMManager = DRMManager;
