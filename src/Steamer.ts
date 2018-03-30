declare const Promise: any;
import * as fs from "fs-extra";
import * as path from "path";

import { DRMManager } from "./DRMManager";
import { SteamerHelpers } from "./SteamerHelpers";
import { SteamUser } from "./SteamUser";

const possibleSteamLocations = [
  "$drive\\Program Files (x86)\\Steam",
  "$drive\\Programmes\\Steam"
];

const shortcutsConfigPath = "userdata\\%user%\\config\\shortcuts.vdf";
const helper: SteamerHelpers = new SteamerHelpers();

export class Steamer {
  public steamDirectory: string;
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
    const drmManager = new DRMManager();
    this.externalGames = await drmManager.getAllGames();
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Check if steam is installed
   */
  private async checkSteamInstallation() {
    console.log("Checking Steam location...");
    const parsedPossibleSteamLocations: string[] = await helper.addDrivesToPossibleLocations(
      possibleSteamLocations
    );
    return new Promise((resolve) => {
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

      helper.log("Steam directory located at " + this.steamDirectory);
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
      resolve();
    });
  }
}
