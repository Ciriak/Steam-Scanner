import { } from "lodash";
import * as path from "path";
import * as shortcut from "steam-shortcut-editor";

import Config from "./Config";
import { logWarn, logError, log } from "./utils/helper.utils";
import { unlinkSync } from "fs-extra";
import { Launcher } from "./Launcher";
import SteamScanner from "./app";
import colors from "colors";

export class SteamUser {
    public userId: string;
    public userDirectory: string = "";
    public shortcutsFilePath: string = "";
    private config: Config;
    private scanner: SteamScanner;
    constructor(userId: string, scanner: SteamScanner) {
        this.userId = userId;
        this.scanner = scanner;
        this.config = scanner.config;
        this.getUserFiles();
    }

    /**
     * Retrieve the user files using their ID
     */
    private getUserFiles() {
        this.userDirectory = path.join(
            this.config.steamDirectory,
            "userdata",
            this.userId
        );
        this.shortcutsFilePath = path.join(
            this.userDirectory,
            "config",
            "shortcuts.vdf"
        );
    }

    /**
     * Update the shortcuts for this user
     *
     * @param isFirstInstance
     *
     * used in case of multiple users, only the first instance send log and notifications
     *
     * It prevent spam (ex : 6 notification because there is 6 steam accounts)
     *
     * @param clean if true : clear all shortcuts added by steam scanner
     */
    public async updateShortcuts(isFirstInstance?: boolean, clean?: boolean) {

        return new Promise((resolve, reject) => {

            // if clean mode, only remove the short
            // TODO only remove items added by SS
            if (clean) {
                logWarn("Removing the shortcut file");
                try {
                    unlinkSync(this.shortcutsFilePath);
                } catch (err) {
                    logError(err.message)
                }

                return resolve();

            }


            let updatedShortcuts: boolean = false;
            let addedShortcuts: number = 0;

            shortcut.parseFile(this.shortcutsFilePath, (err: Error, shortcutData: any) => {
                // if can't parse (ex: shortcut file don't exist) , create a clean object
                if (err || !shortcutData || !shortcutData.shortcuts) {
                    shortcutData = {
                        shortcuts: []
                    };
                    logWarn("WARNING - unable to parse the steam shortcuts file, it will be cleaned");
                }

                const launchersList = this.config.launchers;
                for (const launcherName in launchersList) {
                    if (launchersList.hasOwnProperty(launcherName)) {
                        const launcherConfig = launchersList[launcherName];
                        const launcher = new Launcher(launcherConfig, this.scanner.launchersManager, this.scanner);
                        for (const gameName in launcher.games) {
                            if (launcher.games.hasOwnProperty(gameName)) {
                                const game = launcher.games[gameName];

                                // skip if the binary of the game in unknown
                                if (!game.binaries || !game.binaries[0]) {
                                    continue;
                                }
                                if (isFirstInstance) {
                                    log(
                                        "Looking the " + colors.cyan(gameName) + " in the shortcut file..."
                                    );
                                }

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

                                // the game shortcut already exist, skip
                                if (gameCount > 0) {
                                    if (isFirstInstance) {
                                        log("Shortcut already exist for " + gameName);
                                    }

                                    // if the game has been added twice or more for some reason
                                    if (gameCount > 1) {
                                        if (isFirstInstance) {
                                            logWarn("WARNING - " +
                                                gameName +
                                                " has been added more than once, cleaning...");
                                        }

                                        // remove all unwanted , by their index
                                        unwantedIndexList.reverse(); // reverse the array before => don't fucked up the index list
                                        for (const unwantedIndex of unwantedIndexList) {
                                            shortcutData.shortcuts.splice(unwantedIndex, 1);
                                        }
                                        if (isFirstInstance) {
                                            log(
                                                "Removed " +
                                                unwantedIndexList.length +
                                                " unwanted shortcut(s)"
                                            );
                                        }
                                        updatedShortcuts = true;
                                    }
                                } else {
                                    // shortcut don't already exist, add it
                                    shortcutData.shortcuts.push({
                                        Exe: game.binaries[0],
                                        tags: [launcher.name, "Steam Scanner"],
                                        AppName: game.name,
                                        StartDir: game.folderPath,
                                        steamScanner: true,
                                        AllowDesktopConfig: true,
                                        AlowOverlay: true,
                                    });
                                    updatedShortcuts = true;
                                    addedShortcuts++;

                                    // notify if this is the first instance (and notification are enabled)
                                    if (isFirstInstance) {
                                        log("Added a shortcut for " + colors.cyan(game.name) + " => " + game.binaries[0]);
                                    }
                                }
                            }
                        }
                    }
                }

                if (updatedShortcuts) {
                    if (isFirstInstance) {
                        log("Updating Steam shortcuts...");
                    }
                    shortcut.writeFile(this.shortcutsFilePath, shortcutData, (errW: Error) => {
                        if (isFirstInstance) {
                            log("Writing into shortcuts file...");
                        }
                        if (errW) {
                            logError(errW.message);

                            return resolve();
                        }
                        if (isFirstInstance) {
                            log(colors.cyan(String(addedShortcuts)) + " shortcut(s) added, Steam restart required !");
                        }
                    });


                }

                return resolve();
            });

            return resolve();
        });
    }
}