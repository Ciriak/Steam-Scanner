declare const Promise: any;
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
const { snapshot } = require("process-list");

import { DRMManager } from "./DRMManager";
import { SteamerHelpers } from "./SteamerHelpers";
import { SteamUser } from "./SteamUser";

const possibleSteamLocations = [
  "$drive\\Program Files (x86)\\Steam",
  "$drive\\Programmes\\Steam"
];

const shortcutsConfigPath = "userdata\\%user%\\config\\shortcuts.vdf";
const helper: SteamerHelpers = new SteamerHelpers();
const drmManager = new DRMManager();

export class Steamer {
  public steamDirectory: any;
  public externalGames: any;

  constructor() {
    this.init();
  }

  public async init() {
    await this.checkSteamInstallation();
    await this.updateGames();
    helper.log("Init done !");
    await this.binariesListener();
    setInterval(() => this.binariesListener(), 1000 * 60);  // every min
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
        helper.error("ERR_STEAM_NOT_FOUND");
        return;
      }
    }

    helper.log("Steam directory located at " + this.steamDirectory);

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
        helper.error(e);
        continue;
      }
    }

    helper.log(userDirectories.length + " user(s) found");

    for (const userDir of userDirectories) {
      const userId = path.basename(userDir);
      const user = new SteamUser(userId, this);
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

    // retrieve the list of all current active process
    let processList = await snapshot("cpu", "name");

    // order by cpu usage for perf reason (shorten the loop)
    processList = _.orderBy(processList, "cpu", "desc");
    helper.log(processList.length + " process found");

    // when a game binary is found, we add it to this array
    // this allow to skip the loop if needed
    const gameBinariesFound: string[] = [];

    // for each item check if it exist in the current running process
    for (const item of watchedItems) {

      // skip if the binary of the game has already been found
      if (gameBinariesFound.indexOf(item.game.name) > -1) {
        continue;
      }

      const binaryProcessIndex = _.findIndex(processList, { name: item.binary });

      // A running process corresponding of a game exe has been found !
      if (binaryProcessIndex > -1) {
        helper.log("Process found for " + item.game.name + " ! => " + item.binary);
        await drmManager.setBinaryForGame(item.drm.name, item.game.name, item.binaryPath);
        gameBinariesFound.push(item.game.name);
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }
}
