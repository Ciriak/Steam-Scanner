declare const Promise: any;
import * as _ from "lodash";
import * as notifier from "node-notifier";
import * as path from "path";
import * as fs from "fs-extra";
import * as shortcut from "steam-shortcut-editor";
import { Scanner } from "./Scanner";
import { ScannerHelpers } from "./ScannerHelpers";
let isDev = require("electron-is-dev");
const helper = new ScannerHelpers();
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

  // isFirstInstance : used in case of multiple users, only the first instance send log and notifications
  // this prevent spam (ex : 6 notification because there is 6 steam accounts)
  public async updateShortcuts(isFirstInstance: boolean, clean: boolean) {
    helper.log("Updating shortcuts...");

    //if clean mode, only remove the short
    if (clean) {
      helper.warn(colors.yellow("Removing the shortcut file"));
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
            colors.yellow(
              "WARNING - unable to parse the steam shortcuts file, it will be cleaned"
            )
          );
        }

        if (isDev) {
          helper.log(colors.cyan("---- Content of the shortcuts file ----"));
          helper.log(shortcutData);
          helper.log(colors.cyan("_________________END_________________"));
        }

        const drmList = helper.getConfig("drm");
        for (const drmName in drmList) {
          if (drmList.hasOwnProperty(drmName)) {
            const drm = drmList[drmName];
            for (const gameName in drm.games) {
              if (drm.games.hasOwnProperty(gameName)) {
                const game = drm.games[gameName];

                // skip if the binary of the game in unknown
                if (!game.binary) {
                  continue;
                }

                helper.log(
                  "Looking the " + gameName + " in the shortcut file..."
                );

                // check if the game is already in the steam shortcuts
                let gameCount: number = 0;
                let unwantedIndexList: number[] = [];
                for (let i = 0; i < shortcutData.shortcuts.length; i++) {
                  const shortcut = shortcutData.shortcuts[i];
                  if (
                    shortcut.appname === gameName ||
                    shortcut.appName === gameName
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
                  //if the game has been added twice or more for some reason
                  if (gameCount > 1) {
                    helper.log(
                      colors.yellow(
                        "WARNING - " +
                          gameName +
                          " has been added more than once, cleaning..."
                      )
                    );

                    //remove all unwanted , by their index
                    unwantedIndexList.reverse(); //reverse the array before => don't fucked up the index list
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
                }
                // shortcut don't already exist, add it
                else {
                  // add the new shortcut
                  shortcutData.shortcuts.push({
                    exe: game.binary,
                    tags: [drm.name],
                    appName: game.name,
                    StartDir: game.directory
                  });
                  updatedShortcuts = true;
                  addedShortcuts++;

                  //notify if this is the first instance (and notification are enabled)
                  if (isFirstInstance) {
                    const enableNotifications: any = helper.getConfig(
                      "enableNotifications"
                    );
                    helper.log(
                      colors.green("Added a shortcut for " + game.name + " =>")
                    );
                    helper.log(game.binary);
                    if (enableNotifications) {
                      notifier.notify({
                        title: game.name,
                        message:
                          "This game has been added to your library, please restart Steam",
                        icon: path.join(__dirname, "assets/scanner.png")
                      });
                    }
                  }
                }
              }
            }
          }
        }

        if (updatedShortcuts && isFirstInstance) {
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
