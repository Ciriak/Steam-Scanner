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
let config: Config;
export class Launcher {
  public name: string;
  public binaryName?: string;
  public binaryLocation?: string;

  /**
   * List of games found for this launcher
   */
  public games: { [name: string]: IGame };
  private manager: LaunchersManager;
  private binaryPossibleLocations: string[] = [];
  private gamesPossibleLocations: any[] = [];

  constructor(launcherItem: Launcher, manager: LaunchersManager) {
    this.manager = manager;
    this.name = launcherItem.name;
    this.binaryPossibleLocations = launcherItem.binaryPossibleLocations;
    this.gamesPossibleLocations = launcherItem.gamesPossibleLocations;
    this.binaryName = launcherItem.binaryName;
    config = this.manager.config;
  }

  public async checkInstallation() {
    let launcherConfig: any = config.launchers[this.name];
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
            launcherConfig = this;
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
   * @param isLibrary if this is the librarty launcher, only add the folders that are referenced in the games library
   */
  public async getGamesDirectories(isLibrary: boolean) {
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

          for (const dir of items) {
            const currentGameDir = path.normalize(path.join(locationPath, dir));

            // skip if this is not a folder
            if (!fs.lstatSync(currentGameDir).isDirectory()) {
              continue;
            }

            // TODO probably need to better check here if the folder is indeed a game folder
            const parsedGameDir = path.parse(currentGameDir);
            // if this is the library launcher, only keep the folders that are referenced in the games library
            if (isLibrary) {
              this.checkLibraryGamesFolders(parsedGameDir);
            } else {
              // check if the game already exist in the list
              this.games[parsedGameDir.name] = {
                name: parsedGameDir.name,
                folderPath: currentGameDir,
                binaries: [],
                launcher: this.name
              };
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
    for (const gameName in this.games) {
      if (this.games.hasOwnProperty(gameName)) {
        const gameItem = this.games[gameName];
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
          for (const binary of this.games[gameItem.name].binaries) {
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
          this.games[gameItem.name].binaries = [binariesPathList[0]];
          this.games[gameItem.name].userSet = true;

          continue;
        }

        // if there is more than one binary, add the list the the listenners
        if (gameItem.binaries.length > 1) {
          config.launchers[this.name].games[gameItem.name] = this.games[
            gameItem.name
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
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Check if a given folder correspond to a game referenced in the games library
   * If true, try to find the associated launcher
   * @param checkedDirName name of the current checked directory
   */
  private checkLibraryGamesFolders(parsedDirectory: path.ParsedPath) {
    const checkIndex = _.indexOf(this.manager.scanner.libraryGames, {
      folderPath: parsedDirectory.name
    });
    for (
      let libraryGameIndex = 0;
      libraryGameIndex < this.manager.scanner.libraryGames.length;
      libraryGameIndex++
    ) {
      const libraryGame = this.manager.scanner.libraryGames[libraryGameIndex];
      if (
        libraryGame.folderName === parsedDirectory.name ||
        libraryGame.name === parsedDirectory.name
      ) {
        helper.log(
          "The game " +
            colors.cyan(libraryGame.name) +
            " has been detected, validating ..."
        );
        // The game is referenced in the library, add it to his launcher if it exist on this system
        if (this.checkIfgameCanBeAdded(parsedDirectory, libraryGame)) {
          libraryGame.folderPath = path.join(
            parsedDirectory.dir,
            parsedDirectory.base
          );
          libraryGame.binaries = [
            path.join(libraryGame.folderPath, libraryGame.binaries[0])
          ];
          // all check passed, add it to the corresponding launcher
          try {
            config.launchers[libraryGame.launcher].games[
              libraryGame.name
            ] = libraryGame;
          } catch (error) {
            helper.error(error);
            return false;
          }
        }

        break;
      }
    }
  }

  private checkIfgameCanBeAdded(
    parsedDirectory: path.ParsedPath,
    libraryGame: IGame
  ): boolean {
    // TODO Allow games without launchers

    // refused because the game dont have a known launcher
    if (!libraryGame.launcher) {
      helper.warn(
        "Unable to add " +
          colors.cyan(libraryGame.name) +
          " : no launcher referenced ..."
      );
      return false;
    }
    // refused because the game launcher doesn't exist in this system
    if (!config.launchers[libraryGame.launcher]) {
      helper.warn(
        "Unable to add " +
          colors.cyan(libraryGame.name) +
          " : " +
          libraryGame.launcher +
          " is not detected on this system ..."
      );
      return false;
    }

    // refused because the game doesn't have a valid binary target
    if (!libraryGame.binaries || !libraryGame.binaries[0]) {
      helper.warn(
        "Unable to add " +
          colors.cyan(libraryGame.name) +
          " : " +
          " No binary referenced ..."
      );
      return false;
    }

    // check if the binary referenced in the library exist in this system
    const checkBinaryPath = path.join(
      parsedDirectory.dir,
      parsedDirectory.base,
      libraryGame.binaries[0]
    );

    // refused because the binary referenced doesn't exist in the target folder
    if (!fs.existsSync(checkBinaryPath)) {
      helper.warn(
        "Unable to add " +
          colors.cyan(libraryGame.name) +
          " : " +
          " The file " +
          checkBinaryPath +
          " doesn't exist ..."
      );
      return false;
    }

    return true;
  }
}
