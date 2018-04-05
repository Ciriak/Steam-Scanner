declare const Promise: any;
import * as fs from "fs-extra";
import * as path from "path";
import * as psList from "ps-list";

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
    return new Promise((resolve) => {
      console.log("Init done !");
      resolve();
    });
  }

  /**
   * Scan for Installed DRM and add them to steam
   */
  public async updateGames() {
    this.externalGames = await drmManager.getAllGames();
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
    const processList = await psList({ all: false });
    helper.log(processList.length + " process found");

    processListLoop: for (const processItem of processList) {
      for (const binaryPath of binariesPathList) {
        const binary = path.parse(binaryPath); // full/path/item.exe => item.exe
        if (processItem.name === binary.base) {
          // EXE FOUND !!!
          // add the remaining info
          this.games[gameIndex].binaryPath = binaryPath;
          this.games[gameIndex].binary = binary.base;
          break processListLoop;
        }
      }
    }
  }
}
