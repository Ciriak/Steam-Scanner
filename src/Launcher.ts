declare const Promise: any;
import * as fs from "fs-extra";
import * as _ from "lodash";

import * as path from "path";
import * as recursive from "recursive-readdir";

import * as colors from "colors";
import { Config } from "./Config";
import { LaunchersManager } from "./LaunchersManager";
import { ScannerHelpers } from "./ScannerHelpers";

const helper: ScannerHelpers = new ScannerHelpers();
const config: Config = new Config();

export class Launcher {
  public name: any;
  public binaryName: string;
  public binaryLocation: string;
  public configPath: string;
  public gamesInstallDirectory;
  private manager: LaunchersManager;
  private binaryPossibleLocations: string[] = [];
  private gamesPossibleLocations: any[] = [];

  constructor(launcherItem: any, manager: LaunchersManager) {
    this.manager = manager;
    this.name = launcherItem.name;
    this.binaryPossibleLocations = launcherItem.binaryPossibleLocations;
    this.gamesPossibleLocations = launcherItem.gamesPossibleLocations;
    this.binaryName = launcherItem.binaryName;
  }

  public async checkInstallation() {
    const launcherConfig: any = config.get("launcher." + this.name);
    // if the binary location is not defined, try to find it
    if (!launcherConfig || !launcherConfig.binaryLocation) {
      const parsedPossibleLocations: string[] = await helper.addDrivesToPossibleLocations(
        this.binaryPossibleLocations
      );

      // first we locate the drm directory
      for (let loc of parsedPossibleLocations) {
        loc = path.normalize(path.join(loc, this.binaryName));
        // try to list all the users in the userdata folder of steam
        if (fs.existsSync(loc)) {
          this.binaryLocation = loc;
          config.set("launcher." + this.name, this);
          break;
        }
      }
    } else {
      this.binaryLocation = launcherConfig.binaryLocation;
    }

    if (this.binaryLocation) {
      helper.log(colors.cyan(this.name + " located at " + this.binaryLocation));
    } else {
      helper.log(colors.yellow(this.name + " not found"));
    }
    return new Promise((resolve) => {
      resolve();
    });
  }
  /**
   * Try to retrieve the games from the launcher
   */
  public async getGames() {
    await this.getGamesDirectories();
    await this.getGamesBinaries();
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Try to find games from the launcher propertie => games directory" (ex: "Origin Games")
   */
  private async getGamesDirectories() {
    helper.log("[" + this.name + "] Looking for games directories...");
    for (const possibleLocation of this.gamesPossibleLocations) {
      possibleLocation.path = await helper.addDrivesToPossibleLocations([
        possibleLocation.path
      ]);
      for (const locationPath of possibleLocation.path) {
        /*
        two case possible here
        if uniqueGameFolder === true, scan exe, else scan folders
      */

        // Directory of games
        try {
          const items = fs.readdirSync(locationPath);
          // only keep the directories
          for (const dir of items) {
            const currentGameDir = path.normalize(path.join(locationPath, dir));
            if (fs.lstatSync(currentGameDir).isDirectory()) {
              // push a game item to the global watch list
              this.manager.gamesList.push({
                name: currentGameDir,
                folder: currentGameDir,
                binaries: [],
                launcher: this.name
              });
            }
          }
          // skip if the possible game folder don't exist
        } catch (e) {
          continue;
        }
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Find the games binary
   */
  private async getGamesBinaries() {
    let isKnownGame = false;
    for (
      let gameIndex = 0;
      gameIndex < this.manager.gamesList.length;
      gameIndex++
    ) {
      const gameItem = this.manager.gamesList[gameIndex];

      const binariesPathList = [];

      // set the game name based on his folder
      const parsedGamepath = path.parse(gameItem.folder);
      gameItem.name = parsedGamepath.name;

      const gameConfig: any = config.get(
        "launcher." + this.name + ".games." + gameItem.name
      );

      // if game and his binary are already known => skip
      if (gameConfig && gameConfig.binary) {
        continue;
      }

      // check if the game is a "known" game :
      if (this.manager.gamesList[gameItem.name]) {
        helper.log(
          colors.cyan(
            gameItem.name +
              " is a known game, trying to find one of the known executable..."
          )
        );
        // game is a known game, generate a list of possible binary location
        isKnownGame = true;
      }

      // clean the list of listened binaries
      config.set(
        "launcher." +
          this.name +
          ".games." +
          gameItem.name +
          ".listenedBinaries",
        null
      );

      const filesList = await recursive(gameItem.folder);
      filesListLoop: for (const fileName of filesList) {
        if (isKnownGame) {
          if (!this.manager.gamesList[gameItem.name].binaries) {
            break;
          }
          // only search in known locations (from games.json)
          for (const binary of this.manager.gamesList[gameItem.name].binaries) {
            // ex : c//program/overwatch/Overwatch.exe => Overwatch.exe
            if (fileName.search(binary) > -1) {
              binariesPathList.push(fileName);
              helper.log(colors.green(fileName + " FOUND !"));
              break filesListLoop; // stop everything, we found what we want, a known game executable
            }
          }
        }

        // reference all executables
        if (fileName.search(".exe") > -1) {
          binariesPathList.push(fileName);
        }
      }

      // if there is only one binaries, set it by default
      if (binariesPathList.length === 1) {
        const launcherManager = this.manager;

        config.set(
          "launcher." + this.name + ".games." + gameItem.name,
          gameItem
        );

        await launcherManager.setBinaryForGame(
          this.name,
          gameItem.name,
          binariesPathList[0],
          false
        );
        this.manager.gamesList[gameIndex].binaries = [binariesPathList[0]];
        this.manager.gamesList[gameIndex].binarySet = true;

        continue;
      }

      // if there is more than one binary, add the list the the listenners
      if (binariesPathList.length > 1) {
        config.set(
          "launcher." + this.name + ".games." + gameItem.name,
          gameItem
        );

        /*
          Here, we will listen for an active process to have the same name than a binarie found in the game files
          add the game the the listener, things happend in "Scanner.ts"
        */
        helper.log("Trying to find the process for " + gameItem.name);

        config.set(
          "launcher." +
            this.name +
            ".games." +
            gameItem.name +
            ".listenedBinaries",
          binariesPathList
        );
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }
}