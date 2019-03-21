declare const Promise: any;
import * as colors from "colors";
import { app } from "electron";
import * as fs from "fs-extra";
import * as path from "path";
// import {
//   getIconForPath,
//   ICON_SIZE_EXTRA_SMALL,
//   ICON_SIZE_SMALL
// } from "system-icon";
import { Config } from "./Config";
import { Launcher } from "./Launcher";
import { Scanner } from "./Scanner";
import { ScannerHelpers } from "./ScannerHelpers";
const helper: ScannerHelpers = new ScannerHelpers();

// ===== Pattern for the config file =======
// For the gamesProperties :
// %pattern% :getPath method of Electron => https://github.com/electron/electron/blob/master/docs/api/app.md#appgetpathname
// $this.xxx = a propertie of the current item (ex : name)

export class LaunchersManager {
  public detectedLaunchers: Launcher[] = [];
  public launchersList: Launcher[] = [];
  public config: Config;
  public scanner: Scanner;

  private launchersConfigFilesLocation = path.join(
    __dirname,
    "library",
    "launchers"
  );

  /**
   * retrieve the supported launchers list from library (not an actual scan)
   * retrieve the "unique" games config from the library
   */
  constructor(config: Config, scanner: Scanner) {
    this.config = config;
    this.scanner = scanner;
    this.retrieveLaunchersFromLibrary();
  }

  /**
   * Update the games list for all launchers
   */
  public async getAllGames() {
    // get games from all installed Launcher
    for (
      let launcherIndex = 0;
      launcherIndex < this.detectedLaunchers.length;
      launcherIndex++
    ) {
      const launcher = this.detectedLaunchers[launcherIndex];
      const isLibrary = launcher.name === "Library";
      await launcher.getGamesDirectories(isLibrary);
      await launcher.getGamesBinaries();
    }

    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Return a list of all found launchers (other than steam)
   * Also add a "Library" categorie for games founds from the library
   */
  public async getAllLaunchers() {
    // list installed LauncherS
    helper.log("Checking installed Launchers");
    for (
      let launcherIndex = 0;
      launcherIndex < this.launchersList.length;
      launcherIndex++
    ) {
      const launcherConfig = this.launchersList[launcherIndex];
      const launcher = new Launcher(launcherConfig, this);
      // check instalation except for "library"
      if (launcher.name === "Library") {
        // add lirbary to the launchers list anyway
        this.detectedLaunchers.push(launcher);
        this.config.launchers[launcher.name] = launcher;
        continue;
      }
      await launcher.checkInstallation();
      // binaryLocation has been set, add it to the list
      if (launcher.binaryLocation) {
        this.detectedLaunchers.push(launcher);
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
    try {
      // set the binary
      this.config.launchers[launcherName].games[gameName].binaries = [
        binaryPath
      ];

      // set the userSet propertie if given
      if (userSet) {
        this.config.launchers[launcherName].games[gameName].userSet = true;
      }

      this.config.save();
    } catch (error) {
      helper.error(error);
    }

    // retrieve the icon and generate a file
    await this.generateGameIcon(binaryPath, launcherName, gameName);

    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Scan all json files for launchers on the library
   */
  private retrieveLaunchersFromLibrary() {
    try {
      // scan the launchers config folder
      const launchersFilesList = fs.readdirSync(
        this.launchersConfigFilesLocation
      );
      // loop through all files
      for (
        let launcherFileIndex = 0;
        launcherFileIndex < launchersFilesList.length;
        launcherFileIndex++
      ) {
        const launcherData = fs.readJSONSync(
          path.join(
            this.launchersConfigFilesLocation,
            launchersFilesList[launcherFileIndex]
          )
        );
        // add the launcher config to the launchers list
        this.launchersList.push(launcherData);
      }
    } catch (e) {
      helper.error(
        colors.red("FATAL ERROR ! Unable to retrieve launchers configs !")
      );
      helper.error(colors.red(e));
      helper.quitApp();
    }
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

    // save it into the config

    try {
      this.config.launchers[launcherName].games[gameName].iconPath = {
        16: smallIconFilePath,
        32: mediumIconFilePath
      };
      this.config.save();
    } catch (error) {
      helper.error(error);
    }

    return new Promise((resolve) => {
      resolve();
    });
  }
}
