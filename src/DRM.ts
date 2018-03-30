declare const Promise: any;
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as objectPath from "object-path";
import * as path from "path";

import { parseString } from "xml2js";
import { SteamerHelpers } from "./SteamerHelpers";

const helper: SteamerHelpers = new SteamerHelpers();
const parseXml = parseString;

export class DRM {
  public name: any;
  public isAvailable: boolean;
  public exePossibleLocations: string[] = [];
  public exeLocation: string;
  public configPath: string;
  public configProperties: any;
  public gamesDirectory;

  constructor(drmItem: any) {
    this.name = drmItem.name;
    this.exePossibleLocations = drmItem.exePossibleLocations;
    this.configProperties = drmItem.configProperties;
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
      for (const loc of parsedPossibleLocations) {
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
    if (!this.gamesDirectory) {
      await this.getGamesDirectory();
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  private async getGamesDirectory() {
    let configData: any;
    const propertieAccess = this.configProperties.gamesPathPropertieAccess;
    const configFileType = path.extname(this.configPath).replace(".", "");
    let drmRef = this;

    try {
      configData = fs.readFileSync(this.configPath, "utf-8");
    } catch (e) {
      helper.error(e);
    }

    switch (configFileType) {
      case "xml":
        await parseString(configData, function(err, result) {
          if (err) {
            helper.error(err);
          }
          drmRef.gamesDirectory = objectPath.get(result, propertieAccess);
          if (!drmRef.gamesDirectory) {
            helper.error(
              "[" + this.name + "] ERR_INVALID_CONFIG_PROPERTIE_PATH"
            );
          }
        });
        break;

      default:
        helper.error("[" + this.name + "] ERR_INVALID_CONFIG_EXT");
    }
    return new Promise((resolve) => {
      resolve();
    });
  }
}
