declare const Promise: any;
import { app } from "electron";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
const { snapshot } = require("process-list"); // TODO seem to be buggy for the compilation
const isDev = require("electron-is-dev");
const colors = require("colors");

import { clearInterval } from "timers";
import { DRMManager } from "./DRMManager";
import { ScannerHelpers } from "./ScannerHelpers";
import { SteamUser } from "./SteamUser";
import { TrayManager } from "./TrayManager";

const possibleSteamLocations = [
  "$drive\\Program Files (x86)\\Steam",
  "$drive\\Programmes\\Steam"
];

const shortcusConfigPath = "userdata\\%user%\\config\\shortcuts.vdf";
const defaultCheckInterval: number = 5 * 60 * 1000; // 5min
const helper: ScannerHelpers = new ScannerHelpers();
const drmManager = new DRMManager();
let binariesCheckerInterval: any;
let binaryCheckerCount: number = 0;
const maxBinaryChecking: number = 10;

export class Scanner {
  public steamDirectory: any;
  public externalGames: any;
  public steamUsers: any[] = [];
  public checkInterval: any;
  public versionLabel: any = "Steam Scanner V." + app.getVersion();
  private tray: TrayManager;

  constructor() {
    helper.log(colors.cyan.underline(this.versionLabel));
    if (isDev) {
      helper.log(colors.bgCyan("=== Developement build ==="));
    }

    this.checkInterval = helper.getConfig("checkInterval");
    // set default value for check interval and save it
    if (!this.checkInterval) {
      this.checkInterval = defaultCheckInterval;
      helper.setConfig("checkInterval", this.checkInterval);
    }

    this.tray = new TrayManager(this);
  }

  public async scan() {
    let checkInterval: any = helper.getConfig("checkInterval");
    // set default value for check interval and save it

    if (!checkInterval) {
      checkInterval = defaultCheckInterval;
      helper.setConfig("checkInterval", checkInterval);
    }

    await this.checkSteamInstallation();
    await helper.checkArgv(this);
    await this.updateGames();
    await this.updateShortcuts();
    await this.binariesListener();
    clearInterval(binariesCheckerInterval);
    binariesCheckerInterval = setInterval(
      () => this.binariesListener(),
      10 * 1000
    ); // every 10 sec - 10 times
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Scan for Installed DRM, find the games binaries and add them to the listener
   */
  public async updateGames() {
    await drmManager.getAllGames();
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Check if steam is installed
   */
  private async checkSteamInstallation() {
    helper.log("Checking Steam location...");

    // try to get steam directory from the config
    this.steamDirectory = helper.getConfig("steamDirectory");

    // if steam directory not found, try to find it
    if (!this.steamDirectory) {
      const parsedPossibleSteamLocations: string[] = await helper.addDrivesToPossibleLocations(
        possibleSteamLocations
      );

      // first we locate steam directory
      for (const loc of parsedPossibleSteamLocations) {
        // try to list all the users in the userdata folder of steam
        try {
          const dir = path.join(loc, "userdata");
          fs.readdirSync(dir);
          this.steamDirectory = dir.replace("userdata", "");
        } catch (e) {
          continue;
        }
      }
      if (!this.steamDirectory) {
        helper.error(colors.red("ERR_STEAM_NOT_FOUND"));
        return;
      }
    }

    helper.log(
      colors.green("Steam directory located at " + this.steamDirectory)
    );

    // save steam location
    helper.setConfig("steamDirectory", this.steamDirectory);

    helper.log("Looking for steam accounts...");

    const userDirectories: string[] = [];
    const usersDir = path.join(this.steamDirectory, "userdata");
    const items = fs.readdirSync(usersDir);

    // only keep the directories
    for (const dir of items) {
      const dirPath = path.join(usersDir, dir);
      try {
        if (fs.lstatSync(dirPath).isDirectory()) {
          userDirectories.push(dirPath);
        }
      } catch (e) {
        helper.error(colors.red(e));
        continue;
      }
    }

    helper.log(userDirectories.length + " user(s) found");

    for (const userDir of userDirectories) {
      const userId = path.basename(userDir);
      const user = new SteamUser(userId, this);
      this.steamUsers.push(user);
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  /* A listener that try to find missing binaries for detected games
    We have a list of binaries found in the games directories
    When a active process correspond to one of the game binaries, then it is considered as the game main binarie
  */
  private async binariesListener() {
    binaryCheckerCount++;
    // clear the scan interval if this the 10th time
    if (binaryCheckerCount > maxBinaryChecking) {
      clearInterval(binariesCheckerInterval);
      binaryCheckerCount = 0;
    }
    // we retrieve all waiting binaries

    //  heaven of for !
    const drmList: any = helper.getConfig("drm");
    const watchedItems: any[] = [];

    // references all watched binaries on all found games
    for (const drmName in drmList) {
      if (drmList.hasOwnProperty(drmName)) {
        const drm = drmList[drmName];
        // aLl games of a drm
        for (const gameName in drm.games) {
          if (drm.games.hasOwnProperty(gameName)) {
            const game = drm.games[gameName];

            // skip if no binary is watched
            if (!game.listenedBinaries) {
              continue;
            }

            // all binaries watched for the current game
            for (const binaryPath of game.listenedBinaries) {
              const parsedBinarypath = path.parse(binaryPath);
              const binary = parsedBinarypath.base; // xx.exe
              // add the watched item info to the global list
              watchedItems.push({
                drm: drm,
                game: game,
                binary: binary,
                binaryPath: binaryPath
              });
            }
          }
        }
      }
    }

    // stop if no items watched
    if (watchedItems.length === 0) {
      return new Promise((resolve) => {
        resolve();
      });
    }

    helper.log(
      "Scanning process... [" +
        binaryCheckerCount +
        "/" +
        maxBinaryChecking +
        "]"
    );

    // retrieve the list of all current active process
    let processList = await snapshot("cpu", "name");

    // order by cpu usage for perf reason (shorten the loop)
    processList = _.orderBy(processList, "cpu", "desc");
    helper.log(processList.length + " process found, looking for games...");

    // when a game binary is found, we add it to this array
    // this allow to skip the loop if needed
    const gameBinariesFound: string[] = [];

    // for each item check if it exist in the current running process
    for (const item of watchedItems) {
      // skip if the binary of the game has already been found
      if (gameBinariesFound.indexOf(item.game.name) > -1) {
        continue;
      }

      const binaryProcessIndex = _.findIndex(processList, {
        name: item.binary
      });

      // A running process corresponding of a game exe has been found !
      if (binaryProcessIndex > -1) {
        helper.log(
          colors.green(
            "Process found for " + item.game.name + " ! => " + item.binary
          )
        );
        await drmManager.setBinaryForGame(
          item.drm.name,
          item.game.name,
          item.binaryPath
        );
        gameBinariesFound.push(item.game.name);
        await this.updateShortcuts();
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }

  private async updateShortcuts() {
    // update the shortcuts for all found user
    let isFirstInstance: boolean = true;
    for (const steamUser of this.steamUsers) {
      await steamUser.updateShortcuts(isFirstInstance);
      isFirstInstance = false;
    }
    return new Promise((resolve) => {
      resolve();
    });
  }
}
