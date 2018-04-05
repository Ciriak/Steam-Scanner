declare const Promise: any;
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as objectPath from "object-path";
import * as path from "path";
import * as recursive from "recursive-readdir";

import { SteamerHelpers } from "./SteamerHelpers";

const helper: SteamerHelpers = new SteamerHelpers();

export class DRM {
  public name: any;
  public binaryName: string;
  public binaryLocation: string;
  public configPath: string;
  public gamesInstallDirectory;
  public games: any[];
  private binaryPossibleLocations: string[] = [];
  private gamesPossibleLocations: string[] = [];

  constructor(drmItem: any) {
    this.name = drmItem.name;
    this.binaryPossibleLocations = drmItem.binaryPossibleLocations;
    this.gamesPossibleLocations = drmItem.gamesPossibleLocations;
    this.binaryName = drmItem.binaryName;
    this.games = [];
  }

  public async checkInstallation() {
    const drmConfig: any = helper.getConfig("drm." + this.name);
    // if the binary location is not defined, try to find it
    if (!drmConfig || !drmConfig.binaryLocation) {
      const parsedPossibleLocations: string[] = await helper.addDrivesToPossibleLocations(
        this.binaryPossibleLocations
      );

      // first we locate the drm directory
      for (let loc of parsedPossibleLocations) {
        loc = path.normalize(path.join(loc, this.binaryName));
        // try to list all the users in the userdata folder of steam
        if (fs.existsSync(loc)) {
          this.binaryLocation = loc;
          break;
        }
      }
    } else {
      this.binaryLocation = drmConfig.binaryLocation;
    }

    if (this.binaryLocation) {
      helper.log(this.name + " located at " + this.binaryLocation);
      helper.setConfig("drm." + this.name, this);
    } else {
      helper.log(this.name + " not found");
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  public async getGames() {
    await this.getGamesDirectories();

    await this.getGamesBinaries();

    return new Promise((resolve) => {
      resolve();
    });
  }

  // use the found games directories
  private async getGamesDirectories() {
    const parsedGamesPossibleLocations = await helper.addDrivesToPossibleLocations(
      this.gamesPossibleLocations
    );

    for (const gamesPossibleLocation of parsedGamesPossibleLocations) {
      try {
        const items = fs.readdirSync(gamesPossibleLocation);
        // only keep the directories
        for (const dir of items) {
          const currentGameDir = path.normalize(
            path.join(gamesPossibleLocation, dir)
          );
          if (fs.lstatSync(currentGameDir).isDirectory()) {
            this.games.push({ directory: currentGameDir });
          }
        }
        // skip if the possible game folder don't exist
      } catch (e) {
        continue;
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }

  private async getGamesBinaries() {
    for (let gameIndex = 0; gameIndex < this.games.length; gameIndex++) {
      const gameItem = this.games[gameIndex];

      // set the game name based on his folder
      const parsedGamepath = path.parse(gameItem.directory);
      gameItem.name = parsedGamepath.name;

      const gameConfig: any = helper.getConfig(
        "drm." + this.name + ".games." + gameItem.name
      );

      // if game and his binary are already known => skip
      if (gameConfig && gameConfig.binarie) {
        continue;
      }

      // ignore files named "foo.cs" or files that end in ".html".
      const filesList = await recursive(gameItem.directory);
      const binariesPathList = [];
      for (const fileName of filesList) {
        if (fileName.search(".exe") > -1) {
          binariesPathList.push(fileName);
        }
      }

      // if there is only one binaries then its the game binary (will never happend lol)
      if (binariesPathList.length === 1) {
        this.games[gameIndex].binary = binariesPathList[0];
        helper.setConfig(
          "drm." + this.name + ".games." + gameItem.name,
          gameItem
        );
        continue;
      }

      /*
        Here, we will listen for an active process to have the same name than a binarie found in the game files
        add the game the the listener, things hapened in "Steamer.ts"
      */
      helper.log("Trying to find the process for " + gameItem.name);

      helper.setConfig(
        "drm." + this.name + ".games." + gameItem.name + ".listenedBinaries",
        binariesPathList
      );
    }

    return new Promise((resolve) => {
      resolve();
    });
  }
}
