declare const Promise: any;
import * as drivelist from "drivelist";
import { app } from "electron";
import * as isDev from "electron-is-dev";
import * as electronLog from "electron-log";
import * as path from "path";

import { Scanner } from "./Scanner";

// log config
electronLog.transports.file.level = "info";

export class ScannerHelpers {
  public isDev = isDev;

  /**
   * Report error
   */
  public error(err: string) {
    electronLog.error(err);
  }

  /**
   * Report warning
   */
  public warn(msg: string) {
    electronLog.warn(msg);
  }

  /**
   * Report log
   */
  public log(msg: string) {
    electronLog.info(msg);
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
            if (typeof loc !== "string") {
              continue;
            }
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

  public async checkArgv(scannerInstance: Scanner) {
    const argv = process.argv;
    if (argv.indexOf("--clean") > -1) {
      scannerInstance.cleanning = true;

      await scannerInstance.config.clean(scannerInstance);
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  // close the app
  public quitApp() {
    app.quit();
    process.exit(0);
  }
}
