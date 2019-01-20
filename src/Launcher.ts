declare const Promise: any;
import * as colors from "colors";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import * as recursive from "recursive-readdir";
import { Config } from "./Config";
import { LaunchersManager } from "./LaunchersManager";
import { ScannerHelpers } from "./ScannerHelpers";

const helper: ScannerHelpers = new ScannerHelpers();
const config: Config = new Config();

export class Launcher {
  public name: string;
  public binaryName?: string;
  public binaryLocation?: string;

  /**
   * List of games found for this launcher
   */
  public games: IGame[] = [];
  private manager: LaunchersManager;
  private binaryPossibleLocations: string[] = [];
  private gamesPossibleLocations: any[] = [];

  constructor(launcherItem: ILauncher, manager: LaunchersManager) {
    this.manager = manager;
    this.name = launcherItem.name;
    this.binaryPossibleLocations = launcherItem.binaryPossibleLocations;
    this.gamesPossibleLocations = launcherItem.gamesPossibleLocations;
    this.binaryName = launcherItem.binaryName;
  }

  public async checkInstallation() {
    const launcherConfig: any = config.launchers;
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

          try {
            config.launchers[this.name] = this;
            config.save();
          } catch (error) {
            helper.error(error);
          }
          break;
        }
      }
    } else {
      this.binaryLocation = launcherConfig.binaryLocation;
    }

    if (this.binaryLocation) {
      helper.log(
        colors.green(this.name + " located at " + this.binaryLocation)
      );
    } else {
      helper.log(colors.yellow(this.name + " not found"));
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Try to find games from the launcher propertie (ex: "Origin Games")
   */
  public async getGamesDirectories() {
    // skip if no game directory registered for this launcher (ex: Battle.net)
    if (!this.gamesPossibleLocations) {
      return new Promise((resolve) => {
        resolve();
      });
    }

    helper.log("[" + this.name + "] Looking for games directories...");

    for (const possibleLocation of this.gamesPossibleLocations) {
      possibleLocation.path = await helper.addDrivesToPossibleLocations([
        possibleLocation.path
      ]);
      for (const locationPath of possibleLocation.path) {
        // Directory of games
        try {
          const items = fs.readdirSync(locationPath);
          // only keep the directories
          for (const dir of items) {
            const currentGameDir = path.normalize(path.join(locationPath, dir));
            // TODO probably need to better check here if the folder is indeed a game folder

            if (fs.lstatSync(currentGameDir).isDirectory()) {
              const parsedGameDir = path.parse(currentGameDir);
              // check if the game already exist in the list
              const checkIndex = _.indexOf(this.games, {
                name: parsedGameDir.name
              });
              // add it only if it don't already exist in the list
              if (checkIndex === -1) {
                // push a game item to the global watch list
                this.games.push({
                  name: parsedGameDir.name,
                  folderPath: currentGameDir,
                  binaries: [],
                  launcher: this.name
                });
              }
            }
          }
          // skip if the possible game folder don't exist
        } catch (e) {
          continue;
        }
      }
    }

    helper.log(
      "[" +
        this.name +
        "] " +
        colors.cyan("" + this.games.length + "") +
        " game folder(s) found..."
    );

    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Try to find the games main executables
   * if there is more than one executable, add them to the watch list for the scanner
   */
  public async getGamesBinaries() {
    for (let gameIndex = 0; gameIndex < this.games.length; gameIndex++) {
      const gameItem = this.games[gameIndex];

      const binariesPathList = [];

      const gameConfig: any = config.get(
        "launcher." + this.name + ".games." + gameItem.name
      );

      // Check the config to see if the game and his binary are alkeary known
      // if yes, skip it
      if (
        gameConfig &&
        gameConfig.binaries &&
        gameConfig.binaries.length === 1
      ) {
        continue;
      }

      const filesList = await recursive(gameItem.folderPath);
      // Check all the files in the found directory
      // if one of the file is contained in the game.binaries properties, it is set as the game default binary
      filesListLoop: for (const fileName of filesList) {
        for (const binary of this.games[gameIndex].binaries) {
          if (fileName.search(binary) > -1) {
            binariesPathList.push(fileName);
            helper.log(colors.green(fileName + " FOUND !"));
            break filesListLoop; // stop everything, we found what we want, a known game executable
          }
        }

        // reference all executables
        if (fileName.search(".exe") > -1) {
          binariesPathList.push(fileName);
        }
      }

      gameItem.binaries = binariesPathList;

      if (gameItem.binaries.length === 0) {
        helper.warn(
          colors.yellow(
            "No executable found in the folder for " +
              colors.cyan(gameItem.name) +
              " it has been skipped"
          )
        );
        continue;
      }

      // if there is only one binaries, set it by default
      if (gameItem.binaries.length === 1) {
        try {
          config.launchers[this.name].games[gameItem.name] = gameItem;
          config.save();
        } catch (error) {
          helper.error(error);
        }

        await this.manager.setBinaryForGame(
          this.name,
          gameItem.name,
          binariesPathList[0],
          false
        );
        this.games[gameIndex].binaries = [binariesPathList[0]];
        this.games[gameIndex].userSet = true;

        continue;
      }

      // if there is more than one binary, add the list the the listenners
      if (gameItem.binaries.length > 1) {
        config.launchers[this.name].games[gameItem.name] = this.games[
          gameIndex
        ];

        /*
          Here, we will listen for an active process to have the same name than a binarie found in the game files
          add the game the the listener, things happend in "Scanner.ts"
        */
        helper.log(
          "Watching " +
            colors.cyan("" + gameItem.binaries.length + "") +
            " executable files for the game " +
            colors.cyan(gameItem.name)
        );
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }
}
