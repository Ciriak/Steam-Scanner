declare const Promise: any;
import * as autoLaunch from "auto-launch";
import * as colors from "colors";
import { app } from "electron";
import * as isDev from "electron-is-dev";
import * as electronLog from "electron-log";
import * as fs from "fs-extra";
import * as objectPath from "object-path";
import * as path from "path";
import { Launcher } from "./Launcher";
import { Scanner } from "./Scanner";
import { ScannerHelpers } from "./ScannerHelpers";

const helper = new ScannerHelpers();

// log config
electronLog.transports.file.level = "info";

const configPath = path.normalize(
  path.join(app.getPath("appData"), "Steam Scanner", "config.json")
);

const cleanConfig = {
  steamDirectory: null,
  launchers: {},
  launchOnStartup: true,
  enableNotifications: true,
  minCPUFilter: 15
};

export class Config {
  public steamDirectory: string;
  public launchers: object = {};
  public launchOnStartup: boolean = true;
  public enableNotifications: boolean = true;
  public minCPUFilter: number = 15;
  public scanInterval: number = 2 * 60 * 1000; // 2min;
  public version: number;
  public firstLaunch: boolean = true;
  private isDev: boolean;
  constructor() {
    this.checkIntegrity();
    // Read the package.json
    try {
      const pJson = fs.readJsonSync(path.join(__dirname, "package.json"));
      this.version = pJson.version;
    } catch (error) {
      helper.error(error);
      process.exit();
    }
  }

  /**
   * retrieve a propertie into the config
   * key can be an object path
   * @param key propertie target (launcher.games.Overwatch)
   */
  public get(key: string) {
    try {
      // be sure that the file exist
      fs.ensureFileSync(configPath);
      const parsedKey = key.split(".");
      const configDataTarget = objectPath.get(this, parsedKey);
      return configDataTarget;
    } catch (e) {
      helper.error(colors.red(e));
      return false;
    }
  }

  // Save the current config class into the json
  public save() {
    return true;
    this.checkIntegrity();
    const configData = fs.readJsonSync(configPath);
    try {
      fs.writeJsonSync(configPath, configData);
    } catch (e) {
      helper.error(colors.red(e));
      return false;
    }
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

  /**
   * Read the config to find if the "launchOnStartup" option is enabled, if true, enable it
   */
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
      this.launchOnStartup = false;
      this.save();
      helper.log("Disabled launch on startup");
    } else {
      launcher.enable();
      this.launchOnStartup = true;
      this.save();
      helper.log("Enabled launch on startup");
    }
  }

  /**
   * Read the config to find if the "enableNotifications" option is enabled, if true, enable it
   */
  public updateNotifications() {
    const notif = this.get("enableNotifications");
    this.enableNotifications = notif;
    this.save();
    if (notif === true) {
      helper.log("Notifications enabled");
    } else {
      helper.log("Notifications disabled");
    }
  }

  /**
   * Check if the configFile is valid or corrupted, and create a clean one if needed
   */
  private checkIntegrity() {
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
   * Return a clean config object
   */
  private getCleanConfig() {
    return cleanConfig;
  }
}
