<<<<<<< HEAD
const fs = require("fs-extra");
const path = require("path");

function DRMManager(steamerInstance) {
  this.detectedDrm = [];
  this.steamerInstance = steamerInstance;
  this.drmList = {
    Uplay: {
      name: "Uplay",
      exeLocations: [
        "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\UbisoftGameLauncher.exe",
        "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher\\UbisoftGameLauncher.exe"
      ]
    },
    Origin: {
      name: "Origin",
      exeLocations: [
        "$drive\\Program Files (x86)\\Origin\\Origin.exe",
        "$drive\\Programmes\\Origin\\Origin.exe"
      ],
      gamesLocations: [
        "$drive\\Program Files (x86)\\Origin Games",
        "$drive\\Programmes\\Origin Games"
      ]
    }
  };
  /**
   * Return a list of all found game (other than steam)
   */
  this.getAllGames = function(drmManagerInstance) {
    for (const drnname in this.drmList) {
      if (this.drmList.hasOwnProperty(drnname)) {
        const drm = this.drmList[drnname];
        drmManagerInstance.checkDRMInstallations(drm, this);
      }
    }
  };

  this.checkDRMInstallations = function(drm, drmManagerInstance) {
    drmManagerInstance.steamerInstance.addDrivesToPossibleLocations(
      drm.exeLocations,
      parsedLocations => {
        // first we locate steam directory
        for (const loc of parsedLocations) {
          // try to list all the users in the userdata folder of steam
          if (fs.existsSync(loc)) {
            drm.exe = loc;
            break;
          }
        }
        if (drm.exe) {
          drmManagerInstance.detectedDrm.push(drm.name);
          drmManagerInstance.steamerInstance.log(
            drm.name + " located at " + drm.exe
          );
          return;
        }
      }
    );
  };
}

module.exports = DRMManager;
=======
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
>>>>>>> parent of b689592... //WIP JS rework
