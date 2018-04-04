declare const Promise: any;
import * as fs from "fs-extra";
import * as yaml from "js-yaml";
import * as _ from "lodash";
import * as objectPath from "object-path";
import * as path from "path";
import * as psList from "ps-list";
import * as recursive from "recursive-readdir";

import { parseString } from "xml2js";
import { SteamerHelpers } from "./SteamerHelpers";

const helper: SteamerHelpers = new SteamerHelpers();
const parseXml = parseString;

export class DRM {
  public name: any;
  public isAvailable: boolean;
  public binaryName: string;
  public binaryPossibleLocations: string[] = [];
  public gamesPossibleLocations: string[] = [];
  public binaryLocation: string;
  public configPath: string;
  public gamesInstallDirectory;
  public games: any[];

  constructor(drmItem: any) {
    this.name = drmItem.name;
    this.binaryPossibleLocations = drmItem.binaryPossibleLocations;
    this.gamesPossibleLocations = drmItem.gamesPossibleLocations;
    this.binaryName = drmItem.binaryName;
    this.games = [];
  }

  public async checkInstallation() {
    const parsedPossibleLocations: string[] = await helper.addDrivesToPossibleLocations(
      this.binaryPossibleLocations
    );
    return new Promise((resolve) => {
      // first we locate steam directory
      for (let loc of parsedPossibleLocations) {
        loc = path.normalize(path.join(loc, this.binaryName));
        // try to list all the users in the userdata folder of steam
        if (fs.existsSync(loc)) {
          this.binaryLocation = loc;
          break;
        }
      }
      if (this.binaryLocation) {
        this.isAvailable = true;
        helper.log(this.name + " located at " + this.binaryLocation);
      } else {
        helper.log(this.name + " not found");
      }
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

    const parsedGamesPossibleLocations = await helper.addDrivesToPossibleLocations(this.gamesPossibleLocations);

    for (const gamesPossibleLocation of parsedGamesPossibleLocations) {
      try {
        const items = fs.readdirSync(gamesPossibleLocation);
        // only keep the directories
        for (const dir of items) {
          const currentGameDir = path.normalize(
            path.join(gamesPossibleLocation, dir)
          );
          if (fs.lstatSync(currentGameDir).isDirectory()) {
            this.games.push({
              directory: currentGameDir
            });
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
        return new Promise((resolve) => {
          resolve();
        });
      }

      /*
        Here, we will listen for an active process to have the same name than a binarie found in the game files
      */
      helper.log("Trying to find the process");

      helper.log("retrieving process list...");
      const processList = await psList({
        all: false
      });
      helper.log(processList.length + " process found");

      processListLoop:
      for (const processItem of processList) {
        for (const binaryPath of binariesPathList) {
          const binary = path.parse(binaryPath);  // full/path/item.exe => item.exe
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

    return new Promise((resolve) => {
      resolve();
    });
  }
}
