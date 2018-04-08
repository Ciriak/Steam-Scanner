import * as fs from "fs-extra";
import * as _ from "lodash";
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

    public async updateShortcuts() {
        let addedShortcuts: number = 0;
        shortcut.parseFile(this.shortcutsFilePath, (err, shortcutData) => {
            if (err) {
                helper.error(err);
                return new Promise((resolve) => {
                    resolve();
                });
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
                            const gameShortcutIndex = _.findIndex(shortcutData.shortcuts, { exe: game.binary });
                            // skip this game
                            if (gameShortcutIndex > -1) {
                                continue;
                            }

                            helper.log("Added a shortcut for " + game.name);

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
                    return new Promise((resolve) => {
                        resolve();
                    });
                }
            });

        });

        if (addedShortcuts > 0) {
            helper.log(addedShortcuts + " shortcut(s) added, Steam restart required !");
        }

        return new Promise((resolve) => {
            resolve();
        });

    }

    // retrieve user files
    private initUser() {
        this.directory = path.join(this.steamerInstance.steamDirectory, "userdata", this.userId);
        this.shortcutsFilePath = path.join(this.directory, "config", "shortcuts.vdf");
    }

}
