declare const Promise: any;
import { app } from "electron";
import * as fs from "fs-extra";
import * as objectPath from "object-path";
import * as path from "path";
import * as drivelist from "drivelist";
import * as isDev from "electron-is-dev";
import * as colors from "colors";
import * as electronLog from "electron-log";
import * as autoLaunch from "auto-launch";
import { Scanner } from "./Scanner";
import { SteamUser } from "./SteamUser";
const configPath = path.normalize(
  path.join(app.getPath("appData"), "steam-scanner", "config.json")
);

const cleanConfig = {
  steamDirectory: null,
  drm: {},
  launchOnStartup: true,
  enableNotifications: true,
  minCPUFilter: 15
};

export class ScannerHelpers {
  public isDev = isDev;
  constructor() {
    this.checkConfigFile();
    // ensure default  config for notifications and los
    this.updateLaunchOnStartup();
    this.updateNotifications();
  }

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

  // check if the configFile is valid or corrupted, and create a clean one if needed
  public checkConfigFile() {
    let data;
    try {
      // be sure that the file exist
      fs.ensureFileSync(configPath);
      data = fs.readJsonSync(configPath);

      // if there is a missing propertie in the saved config, reset it
      for (const propertie in cleanConfig) {
        if (!data[propertie]) {
          data[propertie] = cleanConfig[propertie];
        }
      }
    } catch (e) {
      // create a clean config file if don't exist or is corrupted
      // this also happend for the first launch, so we add a notification
      this.log(colors.yellow("NOTICE - creating a clean config file..."));
      data = this.getCleanConfig();
    }
    // write a parsed and validated config file
    fs.writeJsonSync(configPath, data);
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
  // retrieve a propertie into the config
  // key can be an object path
  public getConfig(key: string) {
    try {
      // be sure that the file exist
      fs.ensureFileSync(configPath);
      const configData = fs.readJsonSync(configPath);
      const parsedKey = key.split(".");
      const configDataTarget = objectPath.get(configData, parsedKey);
      return configDataTarget;
    } catch (e) {
      this.error(colors.red(e));
      return false;
    }
  }

  // save a propertie into the config
  public setConfig(key: string, value: any) {
    this.checkConfigFile();
    const configData = fs.readJsonSync(configPath);
    const parsedKey = key.split(".");

    objectPath.ensureExists(configData, parsedKey, value);
    objectPath.set(configData, parsedKey, value);

    try {
      fs.writeJsonSync(configPath, configData);
    } catch (e) {
      this.error(colors.red(e));
      return false;
    }
    return value;
  }

  public async checkArgv(scannerInstance: Scanner) {
    const argv = process.argv;
    if (argv.indexOf("--clean") > -1) {
      await this.clean(scannerInstance);
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  // reset shortcuts & config
  public async clean(scannerInstance: Scanner) {
    // remove the shortcut file for each user
    for (const steamUser of scannerInstance.steamUsers) {
      try {
        fs.removeSync(steamUser.shortcutsFilePath);
      } catch (e) {
        continue;
      }
    }

    try {
      fs.removeSync(configPath);
    } catch (e) {
      this.error(colors.red(e));
    }

    this.log(colors.yellow("=== Config and shortcuts cleaned ==="));

    return new Promise((resolve) => {
      resolve();
    });
  }

  public updateLaunchOnStartup() {
    const launcher = new autoLaunch({ name: "Steam Scanner" });
    const launch = this.getConfig("launchOnStartup");
    if (isDev) {
      this.log(colors.yellow("NOTICE : Dev build, launch on startup ignored"));
      return;
    }
    if (launch === false) {
      launcher.disable();
      this.setConfig("launchOnStartup", false);
      this.log("Disabled launch on startup");
    } else {
      launcher.enable();
      this.setConfig("launchOnStartup", true);
      this.log("Enabled launch on startup");
    }
  }

  public updateNotifications() {
    const notif = this.getConfig("enableNotifications");
    this.setConfig("enableNotifications", notif);
    if (notif === true) {
      this.log("Notifications enabled");
    } else {
      this.log("Notifications disabled");
    }
  }

  // close the app
  public quitApp() {
    app.quit();
    process.exit(0);
  }

  private getCleanConfig() {
    return cleanConfig;
  }
}
