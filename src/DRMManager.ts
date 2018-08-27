declare const Promise: any;
import { app } from "electron";
import * as colors from "colors";
import * as fs from "fs-extra";
import * as path from "path";
let Jimp = require("jimp");
import { DRM } from "./DRM";
import { ScannerHelpers } from "./ScannerHelpers";
import AssociatedIcon from "associated-icon";
const helper: ScannerHelpers = new ScannerHelpers();

//retrieve drms list
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
    //list installed DRMS
    for (const drmName in drmList) {
      if (drmList.hasOwnProperty(drmName)) {
        const drm = new DRM(drmList[drmName]);
        await drm.checkInstallation();
        if (drm.binaryLocation) {
          this.detectedDrm.push(drm);
        }
      }
    }

    //get games from all installed DRM
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
    binaryPath: string,
    userSet: boolean // manually set by the user, wont apply the other rules
  ) {
    // set the binary
    helper.setConfig(
      "drm." + drmName + ".games." + gameName + ".binary",
      binaryPath
    );

    //set the userSet propertie if given
    if (userSet) {
      helper.setConfig(
        "drm." + drmName + ".games." + gameName + ".userSet",
        true
      );
    }

    // clean listenedBinaries prtopertie
    helper.setConfig(
      "drm." + drmName + ".games." + gameName + ".listenedBinaries",
      null
    );

    const iconFilePath = path.normalize(
      path.join(
        app.getPath("appData"),
        "Steam Scanner",
        "icons",
        gameName + ".png"
      )
    );

    //retrieve the icon and generate a file
    await this.generateGameIcon(binaryPath, iconFilePath);

    //save it into the config
    helper.setConfig(
      "drm." + drmName + ".games." + gameName + ".icon",
      iconFilePath
    );

    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Try to retrieve the game icon from his found binaries
   */
  private async generateGameIcon(binaryPath: string, iconFilePath: string) {
    // find associate icon
    let associatedIcon = new AssociatedIcon(); // or new AssociatedIcon(true); (this will use execFile instead of spawn, so this will work in electron)
    let response = await associatedIcon.getBase64Icon(binaryPath);
    fs.ensureFileSync(iconFilePath);
    const buff = Buffer.from(response.Base64Image, "base64");
    //resize and write image
    Jimp.read(buff)
      .then((icon) => {
        return icon
          .resize(16, 16) // resize
          .write(iconFilePath); // save
      })
      .catch((err) => {
        console.error(err);
      });

    return new Promise((resolve) => {
      resolve();
    });
  }
}
