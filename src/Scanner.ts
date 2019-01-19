declare const Promise: any;
import * as colors from "colors";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as notifier from "node-notifier";
import * as path from "path";
import * as recursive from "recursive-readdir";
const ps = require("current-processes");
let isDev = require("electron-is-dev");

const Spinner = require("cli-spinner").Spinner;
import { autoUpdater } from "electron-updater";
const spinner = new Spinner();

if (process.argv.indexOf("--debug") > -1) {
  isDev = true;
}
import { clearInterval } from "timers";
import { Config } from "./Config";
import { LaunchersManager } from "./LaunchersManager";
import { ScannerHelpers } from "./ScannerHelpers";
import { SteamUser } from "./SteamUser";
import { TrayManager } from "./TrayManager";

const possibleSteamLocations = [
  "$drive\\Program Files (x86)\\Steam",
  "$drive\\Programmes\\Steam"
];

const defaultCheckInterval: number = 2 * 60 * 1000; // 2min
let helper: ScannerHelpers;
const launchersManager = new LaunchersManager();
const config: Config = new Config();
let binariesCheckerInterval: any;
let binaryCheckerCount: number = 0;
const maxBinaryChecking: number = 20;

export class Scanner {
  public steamDirectory: any;
  public externalGames: any;
  public steamUsers: SteamUser[] = [];
  public checkInterval: any;
  public minCPUFilter: any;
  public cleanning: boolean = false;
  public isScanning: boolean = false;
  public config: Config = config;
  public versionLabel: string = "Steam Scanner V." + config.version;
  private tray: TrayManager;

  constructor() {
    helper = new ScannerHelpers();
    // ensure default  config for notifications and los
    config.updateLaunchOnStartup();
    config.updateNotifications();

    // show a label in the console
    helper.log(colors.cyan.underline(this.versionLabel));
    if (isDev) {
      helper.log(colors.bgCyan("=== Debug Mode ==="));
    }
    //

    this.checkInterval = config.get("checkInterval"); // ms between 2 check
    // if the cpu usage a a found process is below, it will be ignored
    // it prevent that the setup are added instead of the game exe itself
    this.minCPUFilter = config.get("minCPUFilter");
    // set default value for check interval and save it
    if (!this.checkInterval) {
      this.checkInterval = defaultCheckInterval;
      config.set("checkInterval", this.checkInterval);
    }

    this.tray = new TrayManager(this);
    this.tray.update(this);

    // check updates and repeat every hours
    this.checkUpdates();
    setInterval(() => this.checkUpdates(), 1 * 60 * 60 * 1000); // every hours
  }

  public async scan() {
    // check and appy argv first
    await helper.checkArgv(this);

    this.isScanning = true;
    let checkInterval: number = config.get("checkInterval");
    // set default value for check interval and save it

    // check if this is th first scan ever
    const launched = config.get("launched");
    if (!launched) {
      // notify the user that Steam Scanner run in background
      notifier.notify({
        title: "Steam Scanner is running",
        message: "Click on the tray icon for more options",
        icon: path.join(__dirname, "/assets/scanner.png")
      });
      config.set("launched", true);
    }

    this.tray.update(this);

    if (!checkInterval) {
      checkInterval = defaultCheckInterval;
      config.set("checkInterval", checkInterval);
    }
    this.tray.update(this);
    await this.checkSteamInstallation();
    await this.updateLaunchers();
    await this.updateGames();
    await this.updateShortcuts();
    await this.binariesListener();
    clearInterval(binariesCheckerInterval);
    binariesCheckerInterval = setInterval(
      () => this.binariesListener(),
      5 * 1000
    ); // every 10 sec - 10 times

    // if cleanning has been asked, it has been done
    this.cleanning = false;

    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Scan for Installed Launcher
   */
  public async updateLaunchers() {
    await launchersManager.getAllLaunchers();
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Scan for Installed Launcher, find the games binaries and add them to the listener
   */
  public async updateGames() {
    await launchersManager.getAllGames();
    await this.getGamesBinaries();
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Update the steam Shortcuts (Updated for each steam user)
   */
  public async updateShortcuts() {
    // update the shortcuts for all found user
    let isFirstInstance: boolean = true;
    for (const steamUser of this.steamUsers) {
      await steamUser.updateShortcuts(isFirstInstance, this.cleanning);
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
    this.steamDirectory = config.get("steamDirectory");

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
    config.set("steamDirectory", this.steamDirectory);

    helper.log("Looking for Steam accounts...");

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

  /**
   * A listener that try to find missing binaries for detected games
   * We have a list of binaries found in the games directories
   * When a active process correspond to one of the game binaries, then it is considered as the game main binarie
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
    const launchersList: any = config.get("launchers");
    const watchedItems: any[] = [];

    // references all watched binaries on all found games
    for (const launcherName in launchersList) {
      if (launchersList.hasOwnProperty(launcherName)) {
        const launcher = launchersList[launcherName];
        // aLl games of a drm
        for (const gameName in launcher.games) {
          if (launcher.games.hasOwnProperty(gameName)) {
            const game = launcher.games[gameName];

            // skip if no binary is watched
            if (!game.listenedBinaries) {
              continue;
            }

            // loop on all binaries watched for the current game
            for (const binaryPath of game.listenedBinaries) {
              const parsedBinarypath = path.parse(binaryPath);
              const binary = parsedBinarypath.base; // xx.exe
              // add the watched item info to the global list
              watchedItems.push({
                launcher: launcher,
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
    // TODO use ps-list here
    let processList = await ps.get();

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

        // the binary has been found but don't exist anymore, skip
        const binaryExist = fs.existsSync(item.binaryPath);
        if (!binaryExist) {
          continue;
        }

        spinner.stop(true);
        helper.log(
          colors.green(
            "Process found for " + item.game.name + " ! => " + item.binary
          )
        );
        await launchersManager.setBinaryForGame(
          item.launcher.name,
          item.game.name,
          item.binaryPath,
          false
        );
        gameBinariesFound.push(item.game.name);
        await this.updateShortcuts();
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * Check for update and auto install if a newer version is found
   */
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

  /**
   * Try to find the games main executables
   * if there is more than one executable, add them to the watch list for the scanner
   */
  private async getGamesBinaries() {
    for (
      let gameIndex = 0;
      gameIndex < launchersManager.gamesList.length;
      gameIndex++
    ) {
      const gameItem = launchersManager.gamesList[gameIndex];

      const binariesPathList = [];

      const gameConfig: any = config.get(
        "launcher." + this.name + ".games." + gameItem.name
      );

      // Check the config to see if the game and his binary are alkeary known
      // if yes, skip it
      if (gameConfig && gameConfig.binary) {
        continue;
      }

      // clean the list of listened binaries
      config.set(
        "launcher." +
          this.name +
          ".games." +
          gameItem.name +
          ".listenedBinaries",
        null
      );

      const filesList = await recursive(gameItem.folder);
      // Check all the files in the found directory
      // if one of the file is contained in the game.binaries properties, it is set as the game default binary
      filesListLoop: for (const fileName of filesList) {
        for (const binary of launchersManager.gamesList[gameIndex].binaries) {
          if (fileName.search(binary) > -1) {
            binariesPathList.push(fileName);
            helper.log(colors.green(fileName + " FOUND !"));
            break filesListLoop; // stop everything, we found what we want, a known game executable
          }
        }

        // reference all executables
        if (fileName.search(".exe") > -1) {
          binariesPathList.push(fileName);
        }
      }

      gameItem.binaries = binariesPathList;

      if (gameItem.binaries.length === 0) {
        helper.warn(
          colors.yellow(
            "No executable found in the folder for " +
              colors.cyan(gameItem.name) +
              " it has been skipped"
          )
        );
        continue;
      }

      // if there is only one binaries, set it by default
      if (gameItem.binaries.length === 1) {
        const launcherManager = this.manager;

        config.set(
          "launcher." + this.name + ".games." + gameItem.name,
          gameItem
        );

        await launcherManager.setBinaryForGame(
          this.name,
          gameItem.name,
          binariesPathList[0],
          false
        );
        launchersManager.gamesList[gameIndex].binaries = [binariesPathList[0]];
        launchersManager.gamesList[gameIndex].binarySet = true;

        continue;
      }

      // if there is more than one binary, add the list the the listenners
      if (gameItem.binaries.length > 1) {
        config.set(
          "launcher." + this.name + ".games." + gameItem.name,
          gameItem
        );

        /*
          Here, we will listen for an active process to have the same name than a binarie found in the game files
          add the game the the listener, things happend in "Scanner.ts"
        */
        helper.log(
          "Watching " +
            colors.cyan("" + gameItem.binaries.length + "") +
            " executable files for the game " +
            colors.cyan(gameItem.name)
        );
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }
}
