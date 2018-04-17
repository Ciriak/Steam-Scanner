declare const Promise: any;
import * as fs from "fs-extra";
import * as path from "path";
import { DRM } from "./DRM";
import { SteamerHelpers } from "./SteamerHelpers";
const helper: SteamerHelpers = new SteamerHelpers();
// For the gamesProperties :
// %pattern% :getPath method of Electron => https://github.com/electron/electron/blob/master/docs/api/app.md#appgetpathname
// $this.xxx = a propertie of the current item (ex : name)
const drmList = [
  {
    name: "Uplay",
    binaryName: "UbisoftGameLauncher.exe",
    binaryPossibleLocations: [
      "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher",
      "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher"
    ],
    gamesPossibleLocations: [
      "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games",
      "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher\\games"
    ]
  },
  {
    name: "Origin",
    binaryName: "Origin.exe",
    binaryPossibleLocations: [
      "$drive\\Program Files (x86)\\Origin",
      "$drive\\Programmes\\Origin"
    ],
    gamesPossibleLocations: [
      "$drive\\Program Files (x86)\\Origin Games",
      "$drive\\Programmes\\Origin Games"
    ]
  }
];

export class DRMManager {
  public detectedDrm: DRM[] = [];

  /**
   * Return a list of all found game (other than steam)
   */
  public async getAllGames() {
    for (const drmName in drmList) {
      if (drmList.hasOwnProperty(drmName)) {
        const drm = new DRM(drmList[drmName]);
        await drm.checkInstallation();
        if (drm.binaryLocation) {
          this.detectedDrm.push(drm);
        }
      }
    }

    for (const drmName in this.detectedDrm) {
      if (drmList.hasOwnProperty(drmName)) {
        const drm = this.detectedDrm[drmName];

        await drm.getGames();
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }

  // set the given binary the main one for the given game and save it
  public async setBinaryForGame(
    drmName: string,
    gameName: string,
    binaryPath: string
  ) {
    // set the bninary
    helper.setConfig(
      "drm." + drmName + ".games." + gameName + ".binary",
      binaryPath
    );
    // clean listenedBinaries prtopertie
    helper.setConfig(
      "drm." + drmName + ".games." + gameName + ".listenedBinaries",
      null
    );
    return new Promise((resolve) => {
      resolve();
    });
  }
}
