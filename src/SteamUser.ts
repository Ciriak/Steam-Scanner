declare const Promise: any;
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as notifier from "node-notifier";
import * as path from "path";
import * as shortcut from "steam-shortcut-editor";
import { Steamer } from "./Steamer";
import { SteamerHelpers } from "./SteamerHelpers";
const helper = new SteamerHelpers();

export class SteamUser {
  public userId: any;
  public directory: string;
  public shortcutsFilePath: string;
  private steamerInstance: Steamer;
  constructor(userId: string, steamer: Steamer) {
    this.userId = userId;
    this.steamerInstance = steamer;
    this.initUser();
  }

  // isFirstInstance : used in case of multiple users, only the first instance send log and notifications
  // this prevent spam (ex : 6 notification because there is 6 steam accounts)
  public async updateShortcuts(isFirstInstance: boolean) {
    return new Promise((resolve) => {
      let addedShortcuts: number = 0;

      shortcut.parseFile(this.shortcutsFilePath, (err, shortcutData) => {
        // if can't parse (ex: shortcut file don't exist) , create a clean object
        if (err || !shortcutData || !shortcutData.shortcuts) {
          shortcutData = {
            shortcuts: []
          };
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

                // check if the game is already in the steam shortcuts
                const gameShortcutIndex = _.findIndex(shortcutData.shortcuts, {
                  exe: game.binary
                });
                // skip this game
                if (gameShortcutIndex > -1) {
                  continue;
                }

                if (isFirstInstance) {
                  const enableNotifications: any = helper.getConfig(
                    "enableNotifications"
                  );
                  helper.log("Added a shortcut for " + game.name);
                  if (enableNotifications) {
                    notifier.notify({
                      title: game.name,
                      message:
                        "This game has been added to your game library, please restart Steam"
                    });
                  }
                }

                shortcutData.shortcuts.push({
                  exe: game.binary,
                  tags: [drm.name],
                  appName: game.name,
                  StartDir: game.directory
                });
                addedShortcuts++;
              }
            }
          }
        }
        shortcut.writeFile(this.shortcutsFilePath, shortcutData, (errW) => {
          if (errW) {
            helper.error(errW);

            return resolve();
          }
        });

        if (addedShortcuts > 0 && isFirstInstance) {
          helper.log(
            addedShortcuts + " shortcut(s) added, Steam restart required !"
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
      this.steamerInstance.steamDirectory,
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
