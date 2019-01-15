declare const Promise: any;
import { app } from "electron";
import * as colors from "colors";
import * as path from "path";
import { Launcher } from "./Launcher";
import { ScannerHelpers } from "./ScannerHelpers";
// import {
//   getIconForPath,
//   ICON_SIZE_EXTRA_SMALL,
//   ICON_SIZE_SMALL
// } from "system-icon";
import { Config } from "./Config";
const helper: ScannerHelpers = new ScannerHelpers();
const config: Config = new Config();

//retrieve drms list
let launchersList;
try {
  let launchersConfigFile = require("./launcher.json");
  launchersList = launchersConfigFile.launcher;
} catch (e) {
  helper.error(colors.red("FATAL ERROR ! Unable to read DRM config"));
  helper.error(colors.red(e));
  helper.quitApp();
}

// ===== Pattern for the config file =======
// For the gamesProperties :
// %pattern% :getPath method of Electron => https://github.com/electron/electron/blob/master/docs/api/app.md#appgetpathname
// $this.xxx = a propertie of the current item (ex : name)

export class LauncherManager {
  public detectedDrm: Launcher[] = [];

  /**
   * Return a list of all found game (other than steam)
   */
  public async getAllGames() {
    //list installed DRMS
    for (const launcherName in launchersList) {
      if (launchersList.hasOwnProperty(launcherName)) {
        const launcher = new DRM(launchersList[launcherName]);
        await launcher.checkInstallation();
        if (launcher.binaryLocation) {
          this.detectedDrm.push(drm);
        }
      }
    }

    //get games from all installed DRM
    for (const launcherName in this.detectedDrm) {
      if (launchersList.hasOwnProperty(launcherName)) {
        const launcher = this.detectedDrm[launcherName];

        await launcher.getGames();
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * set the given binary the main one for the given game and save it
   * @param launcherName
   * @param gameName
   * @param binaryPath
   * @param userSet has been set manually buy the user ?
   */
  public async setBinaryForGame(
    launcherName: string,
    gameName: string,
    binaryPath: string,
    userSet: boolean // manually set by the user, wont apply the other rules
  ) {
    // set the binary
    config.set(
      "launcher." + launcherName + ".games." + gameName + ".binary",
      binaryPath
    );

    //set the userSet propertie if given
    if (userSet) {
      config.set(
        "launcher." + launcherName + ".games." + gameName + ".userSet",
        true
      );
    }

    // clean listenedBinaries prtopertie
    config.set(
      "launcher." + launcherName + ".games." + gameName + ".listenedBinaries",
      null
    );

    //retrieve the icon and generate a file
    await this.generateGameIcon(binaryPath, launcherName, gameName);

    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Try to retrieve the game icon from his found binaries
   */
  private async generateGameIcon(
    binaryPath: string,
    launcherName: string,
    gameName: string
  ) {
    const iconBasePath = path.join(
      app.getPath("appData"),
      "Steam Scanner",
      "icons"
    );

    const smallIconFilePath = path.join(iconBasePath, gameName, "16X16.png");
    const mediumIconFilePath = path.join(iconBasePath, gameName, "32X32.png");

    // find associate icon

    // try {
    //   //small icon
    //   fs.ensureFileSync(smallIconFilePath);

    //   fs.ensureFileSync(mediumIconFilePath);

    //   //dirty af :(
    //   getIconForPath(binaryPath, ICON_SIZE_EXTRA_SMALL, function(
    //     err,
    //     smallIconData
    //   ) {
    //     if (err) {
    //       helper.error(err);
    //     }
    //     fs.writeFileSync(smallIconFilePath, smallIconData);
    //     getIconForPath(binaryPath, ICON_SIZE_SMALL, function(
    //       err,
    //       mediumIconData
    //     ) {
    //       if (err) {
    //         helper.error(err);
    //       }
    //       fs.writeFileSync(mediumIconFilePath, mediumIconData);
    //     });
    //   });
    // } catch (err) {
    //   helper.error(err);
    //   return new Promise((resolve) => {
    //     resolve();
    //   });
    // }

    //save it into the config
    config.set("launcher." + launcherName + ".games." + gameName + ".icon", {
      "16": smallIconFilePath,
      "32": mediumIconFilePath
    });

    return new Promise((resolve) => {
      resolve();
    });
  }
}
