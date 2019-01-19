declare const Promise: any;
import * as colors from "colors";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
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
              const checkIndex = _.indexOf(this.manager.gamesList, {
                name: parsedGameDir.name
              });
              // add it only if it don't already exist in the list
              if (checkIndex === -1) {
                // push a game item to the global watch list
                this.manager.gamesList.push({
                  name: parsedGameDir.name,
                  folder: currentGameDir,
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

    return new Promise((resolve) => {
      resolve();
    });
  }
}
