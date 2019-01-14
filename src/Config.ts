declare const Promise: any;
import { app } from "electron";
import * as fs from "fs-extra";
import * as objectPath from "object-path";
import * as path from "path";
import * as isDev from "electron-is-dev";
import * as colors from "colors";
import * as electronLog from "electron-log";
import * as autoLaunch from "auto-launch";
import { Scanner } from "./Scanner";
import { ScannerHelpers } from "./ScannerHelpers";

const helper = new ScannerHelpers();

//log config
electronLog.transports.file.level = "info";

const configPath = path.normalize(
  path.join(app.getPath("appData"), "Steam Scanner", "config.json")
);

const cleanConfig = {
  steamDirectory: null,
  drm: {},
  launchOnStartup: true,
  enableNotifications: true,
  minCPUFilter: 15
};

export class Config {
  public isDev: boolean = isDev;
  public version: string;
  constructor() {
    this.check();
    // Read the package.json
    try {
      const pJson = fs.readJsonSync("./package.json");
      this.version = pJson.version;
    } catch (error) {
      helper.error(error);
      process.exit();
    }
  }

  /**
   * Check if the configFile is valid or corrupted, and create a clean one if needed
   */
  private check() {
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
      helper.log(colors.yellow("NOTICE - creating a clean config file..."));
      data = this.getCleanConfig();
    }
    // write a parsed and validated config file
    fs.writeJsonSync(configPath, data);
  }

  /**
   * retrieve a propertie into the config
   * key can be an object path
   * @param key propertie target (drm.games.Overwatch)
   */
  public get(key: string) {
    try {
      // be sure that the file exist
      fs.ensureFileSync(configPath);
      const configData = fs.readJsonSync(configPath);
      const parsedKey = key.split(".");
      const configDataTarget = objectPath.get(configData, parsedKey);
      return configDataTarget;
    } catch (e) {
      helper.error(colors.red(e));
      return false;
    }
  }

  // save a propertie into the config
  public set(key: string, value: any) {
    this.check();
    const configData = fs.readJsonSync(configPath);
    const parsedKey = key.split(".");

    objectPath.ensureExists(configData, parsedKey, value);
    objectPath.set(configData, parsedKey, value);

    try {
      fs.writeJsonSync(configPath, configData);
    } catch (e) {
      helper.error(colors.red(e));
      return false;
    }
    return value;
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
      helper.error(colors.red(e));
    }

    helper.log(colors.yellow("=== Config and shortcuts cleaned ==="));

    return new Promise((resolve) => {
      resolve();
    });
  }

  public updateLaunchOnStartup() {
    const launcher = new autoLaunch({ name: "Steam Scanner" });
    const launch = this.get("launchOnStartup");
    if (isDev) {
      helper.log(
        colors.yellow("NOTICE : Dev build, launch on startup ignored")
      );
      return;
    }
    if (launch === false) {
      launcher.disable();
      this.set("launchOnStartup", false);
      helper.log("Disabled launch on startup");
    } else {
      launcher.enable();
      this.set("launchOnStartup", true);
      helper.log("Enabled launch on startup");
    }
  }

  public updateNotifications() {
    const notif = this.get("enableNotifications");
    this.set("enableNotifications", notif);
    if (notif === true) {
      helper.log("Notifications enabled");
    } else {
      helper.log("Notifications disabled");
    }
  }

  private getCleanConfig() {
    return cleanConfig;
  }
}
