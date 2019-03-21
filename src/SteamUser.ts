declare const Promise: any;
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as notifier from "node-notifier";
import * as path from "path";
import * as shortcut from "steam-shortcut-editor";
import { Config } from "./Config";
import { Scanner } from "./Scanner";
import { ScannerHelpers } from "./ScannerHelpers";
let isDev = require("electron-is-dev");
const helper: ScannerHelpers = new ScannerHelpers();
const config: Config = new Config();
const colors = require("colors");

if (process.argv.indexOf("--debug") > -1) {
  isDev = true;
}

export class SteamUser {
  public userId: any;
  public directory: string;
  public shortcutsFilePath: string;
  private scannerInstance: Scanner;
  constructor(userId: string, scanner: Scanner) {
    this.userId = userId;
    this.scannerInstance = scanner;
    this.initUser();
  }

  /**
   * Update the shortcuts for this user
   * @param isFirstInstance used in case of multiple users, only the first instance send log and notifications
   * this prevent spam (ex : 6 notification because there is 6 steam accounts)
   * @param clean if true : clear all shortcuts added by steam scanner
   */
  public async updateShortcuts(isFirstInstance: boolean, clean: boolean) {
    // if clean mode, only remove the short
    if (clean) {
      helper.warn("Removing the shortcut file");
      try {
        fs.unlinkSync(this.shortcutsFilePath);
      } catch (err) {
        helper.error(colors.red(err));
      }
      return new Promise((resolve) => {
        resolve();
      });
    }

    return new Promise((resolve) => {
      let updatedShortcuts: boolean = false;
      let addedShortcuts: number = 0;

      shortcut.parseFile(this.shortcutsFilePath, (err, shortcutData) => {
        // if can't parse (ex: shortcut file don't exist) , create a clean object
        if (err || !shortcutData || !shortcutData.shortcuts) {
          shortcutData = {
            shortcuts: []
          };
          helper.warn(
            "WARNING - unable to parse the steam shortcuts file, it will be cleaned"
          );
        }

        // if (isDev) {
        //   helper.log(colors.cyan("---- Content of the shortcuts file ----"));
        //   helper.log(shortcutData);
        //   helper.log(colors.cyan("_________________END_________________"));
        // }

        const launchersList = config.launchers;
        for (const launcherName in launchersList) {
          if (launchersList.hasOwnProperty(launcherName)) {
            const launcher = launchersList[launcherName];
            for (const gameName in launcher.games) {
              if (launcher.games.hasOwnProperty(gameName)) {
                const game = launcher.games[gameName];

                // skip if the binary of the game in unknown
                if (!game.binaries || !game.binaries[0]) {
                  continue;
                }

                helper.log(
                  "Looking the " + gameName + " in the shortcut file..."
                );

                // check if the game is already in the steam shortcuts
                let gameCount: number = 0;
                const unwantedIndexList: number[] = [];
                for (let i = 0; i < shortcutData.shortcuts.length; i++) {
                  const nShortcut = shortcutData.shortcuts[i];
                  if (
                    nShortcut.appname === gameName ||
                    nShortcut.appName === gameName
                  ) {
                    gameCount++;

                    // if the game is already found, add the unwanted copy to the index list
                    if (gameCount > 1) {
                      unwantedIndexList.push(i);
                    }
                  }
                }

                //// the game shortcut already exist, skip
                if (gameCount > 0) {
                  if (isDev) {
                    helper.log("Shortcut already exist for " + gameName);
                  }
                  // if the game has been added twice or more for some reason
                  if (gameCount > 1) {
                    helper.warn(
                      "WARNING - " +
                        gameName +
                        " has been added more than once, cleaning..."
                    );

                    // remove all unwanted , by their index
                    unwantedIndexList.reverse(); // reverse the array before => don't fucked up the index list
                    for (const unwantedIndex of unwantedIndexList) {
                      shortcutData.shortcuts.splice(unwantedIndex, 1);
                    }
                    helper.log(
                      "Removed " +
                        unwantedIndexList.length +
                        " unwanted shortcuts"
                    );
                    updatedShortcuts = true;
                  }
                } else {
                  // shortcut don't already exist, add it
                  // add the new shortcut
                  shortcutData.shortcuts.push({
                    exe: game.binaries[0],
                    tags: [launcher.name],
                    appName: game.name,
                    StartDir: game.folderPath
                  });
                  updatedShortcuts = true;
                  addedShortcuts++;

                  // notify if this is the first instance (and notification are enabled)
                  if (isFirstInstance) {
                    const enableNotifications: any = config.get(
                      "enableNotifications"
                    );
                    helper.log(
                      colors.green("Added a shortcut for " + game.name + " =>")
                    );
                    helper.log(game.binaries[0]);
                    // let icon = path.join(__dirname, "assets/scanner.png");

                    // if (game.icon) {
                    //   icon = path.normalize(game.icon["32"]);
                    // }
                    if (enableNotifications) {
                      notifier.notify({
                        title: game.name,
                        message:
                          "This game has been added to your library, please restart Steam",
                        icon: icon
                      });
                    }
                  }
                }
              }
            }
          }
        }

        if (updatedShortcuts && isFirstInstance) {
          helper.log("Updating Steam shortcuts...");
          shortcut.writeFile(this.shortcutsFilePath, shortcutData, (errW) => {
            helper.log("Writing into shortcuts file...");
            if (errW) {
              helper.error(colors.red(errW));

              return resolve();
            }
          });

          helper.log(
            colors.cyan(
              addedShortcuts + " shortcut(s) added, Steam restart required !"
            )
          );
        }

        return resolve();
      });

      return resolve();
    });
  }

  // retrieve user files
  private initUser() {
    this.directory = path.join(
      this.scannerInstance.steamDirectory,
      "userdata",
      this.userId
    );
    this.shortcutsFilePath = path.join(
      this.directory,
      "config",
      "shortcuts.vdf"
    );
  }
}
