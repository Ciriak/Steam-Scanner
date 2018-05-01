declare const Promise: any;
import { app } from "electron";
import * as fs from "fs-extra";
import * as path from "path";
import * as colors from "colors";
import { DRM } from "./DRM";
import { ScannerHelpers } from "./ScannerHelpers";
const helper: ScannerHelpers = new ScannerHelpers();

let drmList;
try {
  let drmConfigFile = require("./drm.json");
  drmList = drmConfigFile.drm;
} catch (e) {
  helper.error(colors.red("FATAL ERROR ! Unable to read DRM config"));
  helper.error(e);
  helper.quitApp();
}

// ===== Pattern for the config file =======
// For the gamesProperties :
// %pattern% :getPath method of Electron => https://github.com/electron/electron/blob/master/docs/api/app.md#appgetpathname
// $this.xxx = a propertie of the current item (ex : name)

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
