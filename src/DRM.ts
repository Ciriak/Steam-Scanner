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
  public exeName: string;
  public exePossibleLocations: string[] = [];
  public exeLocation: string;
  public configPath: string;
  public configProperties: any;
  public gamesInstallDirectory;
  public games: string[];

  constructor(drmItem: any) {
    this.name = drmItem.name;
    this.exePossibleLocations = drmItem.exePossibleLocations;
    this.exeName = drmItem.exeName;
    this.configProperties = drmItem.configProperties;
    this.games = [];
    this.configPath = helper.parseFilePath(
      this.configProperties.configFilePath
    );
  }

  public async checkInstallation() {
    const parsedPossibleLocations: string[] = await helper.addDrivesToPossibleLocations(
      this.exePossibleLocations
    );
    return new Promise((resolve) => {
      // first we locate steam directory
      for (let loc of parsedPossibleLocations) {
        loc = path.normalize(path.join(loc, this.exeName));
        // try to list all the users in the userdata folder of steam
        if (fs.existsSync(loc)) {
          this.exeLocation = loc;
          break;
        }
      }
      if (this.exeLocation) {
        this.isAvailable = true;
        helper.log(this.name + " located at " + this.exeLocation);
      } else {
        helper.log(this.name + " not found");
      }
      resolve();
    });
  }

  public async getGames() {
    // be sure to get Games Directory
    await this.getGamesInstallDirectory();

    await this.getGamesDirectories();

    await this.getGamesBinaries();

    return new Promise((resolve) => {
      resolve();
    });
  }

  private async getGamesInstallDirectory() {
    let configData: any;
    const propertieAccess = this.configProperties.gamesPathPropertieAccess;
    const configFileType = path.extname(this.configPath).replace(".", "");
    const drmRef = this;

    try {
      configData = fs.readFileSync(this.configPath, "utf-8");
    } catch (e) {
      helper.error(e);
    }

    switch (configFileType) {
      case "xml":
        await parseXml(configData, function(err, result) {
          if (err) {
            helper.error(err);
          }
          drmRef.gamesInstallDirectory = objectPath.get(
            result,
            propertieAccess
          );
        });
        break;
      case "yml":
        try {
          const result = yaml.safeLoad(configData);
          drmRef.gamesInstallDirectory = objectPath.get(
            result,
            propertieAccess
          );
        } catch (e) {
          helper.error(e);
        }
        break;
      // unknown config file scenario
      default:
        helper.error("[" + this.name + "] ERR_INVALID_CONFIG_EXT");
        return;
    }

    // if no game directory propertie found
    if (!drmRef.gamesInstallDirectory) {
      helper.error("[" + this.name + "] ERR_INVALID_CONFIG_PROPERTIE_PATH");
      return;
    }

    // ensure that the directory specified exist
    const exists = await fs.pathExists(drmRef.gamesInstallDirectory);
    // if not
    if (!exists) {
      // unset the propertie
      drmRef.gamesInstallDirectory = null;
      helper.error("[" + this.name + "] ERR_SPECIFIED_DIR_DONT_EXIST");
    }

    if (!this.gamesInstallDirectory) {
      helper.log(
        "[" + this.name + "] Unable to get games, games directory not found !"
      );
    }

    return new Promise((resolve) => {
      resolve();
    });
  }

  // use the found games directories
  private async getGamesDirectories() {
    if (!this.gamesInstallDirectory) {
      return false;
    }
    try {
      const items = fs.readdirSync(this.gamesInstallDirectory);
      // only keep the directories
      for (const dir of items) {
        const currentGameDir = path.normalize(
          path.join(this.gamesInstallDirectory, dir)
        );
        if (fs.lstatSync(currentGameDir).isDirectory()) {
          this.games.push(currentGameDir);
        }
      }
    } catch (e) {
      helper.error(e);
    }

    return new Promise((resolve) => {
      resolve();
    });
  }

  private async getGamesBinaries() {
    for (const gameDirectory of this.games) {
      // ignore files named "foo.cs" or files that end in ".html".
      const filesList = await recursive(gameDirectory);
      const exeList = [];
      for (const fileName of filesList) {
        if (fileName.search(".exe") > -1) {
          exeList.push(fileName);
        }
      }

      // if there is only one exe then its the game binarie (will never hapenned lol)
      if (exeList.length === 1) {
        this.games.push(exeList[0]);
        return new Promise((resolve) => {
          resolve();
        });
      }

      /*
        Here, we will listen for an active process to have the same name than a binarie found in the game files
      */
      helper.log("Trying to find the process");

      console.log("retrieving process list...");
      const v = await psList({
        all: false
      });
      console.log(v);
      console.log(v.length + " process found");
    }

    return new Promise((resolve) => {
      resolve();
    });
  }
}
