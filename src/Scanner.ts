declare const Promise: any;
import { app } from "electron";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as notifier from "node-notifier";
import * as path from "path";
import * as colors from "colors";
const { snapshot } = require("process-list");
let isDev = require("electron-is-dev");

const Spinner = require("cli-spinner").Spinner;
import { autoUpdater } from "electron-updater";
const spinner = new Spinner();

//TODO Find why it add the same shortcut multiple time

if (process.argv.indexOf("--debug") > -1) {
  isDev = true;
}
import { clearInterval } from "timers";
import { DRMManager } from "./DRMManager";
import { ScannerHelpers } from "./ScannerHelpers";
import { SteamUser } from "./SteamUser";
import { TrayManager } from "./TrayManager";

const possibleSteamLocations = [
  "$drive\\Program Files (x86)\\Steam",
  "$drive\\Programmes\\Steam"
];

const shortcusConfigPath = "userdata\\%user%\\config\\shortcuts.vdf";
const defaultCheckInterval: number = 2 * 60 * 1000; // 2min
const helper: ScannerHelpers = new ScannerHelpers();
const drmManager = new DRMManager();
let binariesCheckerInterval: any;
let binaryCheckerCount: number = 0;
const maxBinaryChecking: number = 20;

export class Scanner {
  public steamDirectory: any;
  public externalGames: any;
  public steamUsers: any[] = [];
  public checkInterval: any;
  public minCPUFilter: any;
  public isScanning: boolean = false;
  public versionLabel: any = "Steam Scanner V." + app.getVersion();
  private tray: TrayManager;

  constructor() {
    helper.log(colors.cyan.underline(this.versionLabel));
    if (isDev) {
      helper.log(colors.bgCyan("=== Debug Mode ==="));
    }

    this.checkInterval = helper.getConfig("checkInterval"); // ms between 2 check
    // if the cpu usage a a found process is below, it will be ignored
    // it prevent that the setup are added instead of the game exe itself
    this.minCPUFilter = helper.getConfig("minCPUFilter");
    // set default value for check interval and save it
    if (!this.checkInterval) {
      this.checkInterval = defaultCheckInterval;
      helper.setConfig("checkInterval", this.checkInterval);
    }

    this.tray = new TrayManager(this);
    this.tray.update(this);

    const launched = helper.getConfig("launched");
    if (!launched) {
      // notify the user that Steam Scanner run in background
      notifier.notify({
        title: "Steam Scanner is running",
        message: "Click on the tray icon for more options",
        icon: path.join(__dirname, "assets/scanner.png")
      });
      helper.setConfig("launched", true);
    }

    // check updates and repeat every hours
    this.checkUpdates();
    setInterval(() => this.checkUpdates(), 1 * 60 * 60 * 1000); // every hours
  }

  public async scan() {
    this.isScanning = true;
    let checkInterval: any = helper.getConfig("checkInterval");
    // set default value for check interval and save it

    this.tray.update(this);

    if (!checkInterval) {
      checkInterval = defaultCheckInterval;
      helper.setConfig("checkInterval", checkInterval);
    }
    this.tray.update(this);

    await this.checkSteamInstallation();
    await helper.checkArgv(this);
    await this.updateGames();
    await this.updateShortcuts();
    await this.binariesListener();
    clearInterval(binariesCheckerInterval);
    binariesCheckerInterval = setInterval(
      () => this.binariesListener(),
      5 * 1000
    ); // every 10 sec - 10 times
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Scan for Installed DRM, find the games binaries and add them to the listener
   */
  public async updateGames() {
    await drmManager.getAllGames();
    return new Promise((resolve) => {
      resolve();
    });
  }

  // update the steamShortcuts (send the query to each Steam user found)
  public async updateShortcuts() {
    // update the shortcuts for all found user
    let isFirstInstance: boolean = true;
    for (const steamUser of this.steamUsers) {
      await steamUser.updateShortcuts(isFirstInstance);
      isFirstInstance = false;
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Check if steam is installed
   */
  private async checkSteamInstallation() {
    helper.log("Checking Steam location...");

    // try to get steam directory from the config
    this.steamDirectory = helper.getConfig("steamDirectory");

    // if steam directory not found, try to find it
    if (!this.steamDirectory) {
      const parsedPossibleSteamLocations: string[] = await helper.addDrivesToPossibleLocations(
        possibleSteamLocations
      );

      // first we locate steam directory
      for (const loc of parsedPossibleSteamLocations) {
        // try to list all the users in the userdata folder of steam
        try {
          const dir = path.join(loc, "userdata");
          fs.readdirSync(dir);
          this.steamDirectory = dir.replace("userdata", "");
        } catch (e) {
          continue;
        }
      }
      if (!this.steamDirectory) {
        helper.error(colors.red("ERR_STEAM_NOT_FOUND"));
        return;
      }
    }

    helper.log(
      colors.green("Steam directory located at " + this.steamDirectory)
    );

    // save steam location
    helper.setConfig("steamDirectory", this.steamDirectory);

    helper.log("Looking for steam accounts...");

    const userDirectories: string[] = [];
    const usersDir = path.join(this.steamDirectory, "userdata");
    const items = fs.readdirSync(usersDir);

    // only keep the directories
    for (const dir of items) {
      const dirPath = path.join(usersDir, dir);
      try {
        if (fs.lstatSync(dirPath).isDirectory()) {
          userDirectories.push(dirPath);
        }
      } catch (e) {
        helper.error(colors.red(e));
        continue;
      }
    }

    helper.log(userDirectories.length + " user(s) found");

    for (const userDir of userDirectories) {
      const userId = path.basename(userDir);
      const user = new SteamUser(userId, this);
      this.steamUsers.push(user);
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  /* A listener that try to find missing binaries for detected games
    We have a list of binaries found in the games directories
    When a active process correspond to one of the game binaries, then it is considered as the game main binarie
  */
  private async binariesListener() {
    binaryCheckerCount++;
    // clear the scan interval if this the 10th time
    if (binaryCheckerCount > maxBinaryChecking) {
      clearInterval(binariesCheckerInterval);
      binaryCheckerCount = 0;
      if (spinner.isSpinning()) {
        spinner.stop(true);
      }
      this.isScanning = false;
      this.tray.update(this);
      helper.log("Stopping scan");
      return new Promise((resolve) => {
        resolve();
      });
    }

    this.tray.update(this);

    // we retrieve all waiting binaries

    //  heaven of for !
    const drmList: any = helper.getConfig("drm");
    const watchedItems: any[] = [];

    // references all watched binaries on all found games
    for (const drmName in drmList) {
      if (drmList.hasOwnProperty(drmName)) {
        const drm = drmList[drmName];
        // aLl games of a drm
        for (const gameName in drm.games) {
          if (drm.games.hasOwnProperty(gameName)) {
            const game = drm.games[gameName];

            // skip if no binary is watched
            if (!game.listenedBinaries) {
              continue;
            }

            // all binaries watched for the current game
            for (const binaryPath of game.listenedBinaries) {
              const parsedBinarypath = path.parse(binaryPath);
              const binary = parsedBinarypath.base; // xx.exe
              // add the watched item info to the global list
              watchedItems.push({
                drm: drm,
                game: game,
                binary: binary,
                binaryPath: binaryPath
              });
            }
          }
        }
      }
    }

    // stop if no items watched
    if (watchedItems.length === 0) {
      this.isScanning = false;
      this.tray.update(this);
      return new Promise((resolve) => {
        resolve();
      });
    }

    // retrieve the list of all current active process
    let processList = await snapshot("cpu", "name");

    // order by cpu usage for perf reason (shorten the loop)
    processList = _.orderBy(processList, "cpu", "desc");
    // helper.log(processList.length + " process found, looking for games...");
    spinner.setSpinnerTitle(
      "%s Scanning running process... | Try [" +
        binaryCheckerCount +
        "/" +
        maxBinaryChecking +
        "] " +
        " | " +
        processList.length +
        " process active"
    );

    if (!spinner.isSpinning()) {
      spinner.start();
    }

    // when a game binary is found, we add it to this array
    // this allow to skip the loop if needed
    const gameBinariesFound: string[] = [];

    // for each item check if it exist in the currents active process
    for (const item of watchedItems) {
      // skip if the binary of the game has already been found
      if (gameBinariesFound.indexOf(item.game.name) > -1) {
        continue;
      }

      const binaryProcessIndex = _.findIndex(processList, {
        name: item.binary
      });

      // A running process corresponding of a game exe has been found !
      if (binaryProcessIndex > -1) {
        const processObj = processList[binaryProcessIndex];
        // skip if the item is too low in cpu usage ([minCPUFilter]%)
        if (processObj.cpu < this.minCPUFilter) {
          continue;
        }

        //the binary has been found but don't exist anymore, skip
        let binaryExist = fs.existsSync(item.binaryPath);
        if (!binaryExist) {
          continue;
        }

        spinner.stop(true);
        helper.log(
          colors.green(
            "Process found for " + item.game.name + " ! => " + item.binary
          )
        );
        await drmManager.setBinaryForGame(
          item.drm.name,
          item.game.name,
          item.binaryPath
        );
        gameBinariesFound.push(item.game.name);
        await this.updateShortcuts();
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }

  private checkUpdates() {
    if (isDev) {
      helper.log(colors.cyan("Updater logs enabled"));
    }
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on("checking-for-update", function() {
      if (isDev) {
        helper.log("Checking for updates...");
      }
    });

    autoUpdater.on("error", function(error) {
      if (isDev) {
        helper.log("Update error");
      }
    });

    autoUpdater.on("update-available", function() {
      if (isDev) {
        helper.log("Update available");
      }
    });

    autoUpdater.on("update-not-available", function() {
      if (isDev) {
        helper.log("No update available");
      }
    });

    autoUpdater.on("update-downloaded", function() {
      if (isDev) {
        helper.log("Update downloaded");
      }
      autoUpdater.quitAndInstall(true, true);
    });

    autoUpdater.on("download-progress", function(progress) {
      if (isDev) {
        progress.percent = Math.round(progress.percent);
        helper.log("Downloading update : " + progress.percent + "%");
      }
    });
  }
}
