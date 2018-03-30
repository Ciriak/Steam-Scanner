declare const Promise: any;
import { app } from "electron";
import * as fs from "fs-extra";
import * as path from "path";
const drivelist = require("drivelist");

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
      occurences[0], // %appdata%
      app.getPath(isolatedOccurence) // appdata
    );
    parsedPath = path.normalize(parsedPath);
    return parsedPath;
  }
}
