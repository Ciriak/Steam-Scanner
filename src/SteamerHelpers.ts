declare const Promise: any;
import { app } from "electron";
import * as fs from "fs-extra";
import * as objectPath from "object-path";
import * as path from "path";
const drivelist = require("drivelist");
const configPath = path.normalize(
  path.join(app.getPath("appData"), "Steamer", "config.json")
);

export class SteamerHelpers {
  /**
   * Report error
   */
  public error(err: string) {
    console.error(err);
  }

  /**
   * Report log
   */
  public log(msg: string) {
    console.log(msg);
  }

  /**
   * Take a list of possible location and extend it to all drive available on the machine
   * return the same object with more propertyes
   * $drive is replaced
   */

  public addDrivesToPossibleLocations(possibleLocations: string[]) {
    return new Promise((resolve) => {
      const mountPoints: string[] = [];
      const parsedPossibleLocations: string[] = [];
      drivelist.list((error: any, drives: any) => {
        for (const drive of drives) {
          for (const mountPoint of drive.mountpoints) {
            mountPoints.push(mountPoint.path);
          }
        }

        for (const mountPoint of mountPoints) {
          for (const loc of possibleLocations) {
            parsedPossibleLocations.push(
              path.normalize(loc.replace("$drive", mountPoint))
            );
          }
        }

        resolve(parsedPossibleLocations);
      });
    });
  }

  public parseFilePath(givenPath: string) {
    let parsedPath: string;
    const regex = /%.*?%/;
    const occurences = givenPath.match(regex);
    const isolatedOccurence = occurences[0].replace(/%/g, "");

    parsedPath = givenPath.replace(
      occurences[0],
      app.getPath(isolatedOccurence)
    ); // %appdata% // appdata
    parsedPath = path.normalize(parsedPath);
    return parsedPath;
  }
  // retrieve a propertie into the config
  // key can be an object path
  public getConfig(key: string) {
    try {
      // be sure that the file exist
      fs.ensureFileSync(configPath);
      const configData = fs.readJsonSync(configPath);
      const configDataTarget = objectPath.get(configData, key);
      return configDataTarget;
    } catch (e) {
      this.error(e);
      return false;
    }
  }

  // save a propertie into the config
  public setConfig(key: string, value: any) {
    let configData: object;
    try {
      // be sure that the file exist
      fs.ensureFileSync(configPath);
      configData = fs.readJsonSync(configPath);
    } catch (e) {
      // create a clean config file if don't exist or is corrupted
      configData = this.getCleanConfig();
    }

    objectPath.ensureExists(configData, key, value);

    try {
      fs.writeJsonSync(configPath, configData);
      return value;
    } catch (e) {
      this.error(e);
      return false;
    }
  }

  private getCleanConfig() {
    return { steamDirectory: null, drm: {} };
  }
}
