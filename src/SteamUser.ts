import { } from "lodash";
import * as path from "path";
import * as shortcut from "steam-shortcut-editor";

import Config from "./Config";
import { logWarn, logError, log } from "./utils/helper.utils";
import { unlinkSync } from "fs-extra";
import { Launcher } from "./Launcher";
import SteamScanner from "./app";
import colors from "colors";
import IGame from "./interfaces/Game.interface";

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

        return new Promise(async (resolve, reject) => {

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

                // loop each launcher
                for (const installedLauncher of this.scanner.launchersManager.installedLaunchers) {

                    const launcher = this.config.launchers[installedLauncher.name];

                    // each game of the current launcher
                    for (const gameName in launcher.games) {
                        if (launcher.games.hasOwnProperty(gameName)) {

                            // game
                            const game = launcher.games[gameName];

                            // skip if the binary of the game in unknown
                            if (!game.binaries || !game.binaries[0]) {
                                continue;
                            }

                            if (game.hidden) {
                                continue;
                            }

                            if (isFirstInstance) {
                                log(
                                    "Looking for " + colors.cyan(gameName) + " in the shortcut file..."
                                );
                            }

                            // check if the game is already in the steam shortcuts
                            const { gameCount, unwantedIndexesList } = this.parseEntriesForGame(game, shortcutData);

                            /**
                             * shortcut don't already exist => add it
                             */
                            if (gameCount === 0) {
                                shortcutData.shortcuts.push({
                                    Exe: game.binaries[0],
                                    tags: [launcher.name, "Steam Scanner"],
                                    AppName: game.name,
                                    StartDir: game.folderPath,
                                    steamScanner: true,
                                    AllowDesktopConfig: true,
                                    AlowOverlay: true,
                                    // add the current time as the last play time for the shortcut
                                    LastPlayTime: new Date().getTime() / 1000,
                                });
                                updatedShortcuts = true;
                                addedShortcuts++;

                                // notify if this is the first instance (and notification are enabled)
                                if (isFirstInstance) {
                                    log("Added a shortcut for " + colors.cyan(game.name) + " => " + game.binaries[0]);
                                }
                            }


                            /**
                             * shortcut already exist => Do nothing
                             */

                            if (gameCount === 1) {
                                if (isFirstInstance) {
                                    log("Shortcut already exist for " + gameName);
                                }
                            }

                            /**
                             * case : > 1
                             * More than one iteration of the shortcut exist => Cleanup
                             */
                            if (gameCount > 1) {
                                if (isFirstInstance) {
                                    logWarn("WARNING - " +
                                        gameName +
                                        " has been added more than once, cleaning...");
                                }

                                // remove all unwanted , by their index
                                unwantedIndexesList.reverse(); // reverse the array before => force the removing of the last item
                                for (const unwantedIndex of unwantedIndexesList) {
                                    shortcutData.shortcuts.splice(unwantedIndex, 1);
                                }
                                if (isFirstInstance) {
                                    log(
                                        "Removed " +
                                        unwantedIndexesList.length +
                                        " unwanted shortcut(s)"
                                    );
                                }
                                updatedShortcuts = true;
                            }

                        }

                    }

                    // if at least one shortcut has been updated
                    if (updatedShortcuts) {
                        if (isFirstInstance) {
                            log("Updating Steam shortcuts...");
                        }

                        this.writeShortcutFile(shortcutData, isFirstInstance);
                    }
                }

                return resolve();
            });
        });
    }

    /**
     * Remove the entry of a game from the shortcuts file
     * @param game
     */
    public async removeShortcut(game: IGame, isFirstInstance?: boolean) {
        return new Promise((resolve) => {
            shortcut.parseFile(this.shortcutsFilePath, async (err: Error, shortcutData: any) => {
                // if can't parse (ex: shortcut file don't exist) , create a clean object
                if (err || !shortcutData || !shortcutData.shortcuts) {
                    logError("WARNING - unable to parse the steam shortcuts file");
                    return;
                }

                let indexToRemove: number = -1;

                for (let shortcutIndex = 0; shortcutIndex < shortcutData.shortcuts.length; shortcutIndex++) {
                    const shortcutEntry = shortcutData.shortcuts[shortcutIndex];
                    if (shortcutEntry.AppName === game.name) {
                        indexToRemove = shortcutIndex;
                    }
                }

                if (indexToRemove === -1) {
                    return resolve();
                }

                shortcutData.shortcuts.splice(indexToRemove, 1);
                await this.writeShortcutFile(shortcutData, isFirstInstance);
                return resolve();
            });
        });
    }

    /**
     * Check the entries of the game already present in the shortcut file
     * @param game game instance
     * @param shortcutData current shortcut data
     */
    private parseEntriesForGame(game: IGame, shortcutData: any): {
        gameCount: number,
        unwantedIndexesList: number[]
    } {
        let gameCount = 0;
        const unwantedIndexesList: number[] = [];
        for (let i = 0; i < shortcutData.shortcuts.length; i++) {
            const nShortcut = shortcutData.shortcuts[i];
            if (
                nShortcut.AppName === game.name
            ) {
                gameCount++;

                // if the game is already found, add the unwanted copy to the index list
                if (gameCount > 1) {
                    unwantedIndexesList.push(i);
                }
            }
        }

        return {
            gameCount,
            unwantedIndexesList
        }
    }

    /**
     * Write the provided data into the shortcuts file
     * @param shortcutData data to write
     */
    private async writeShortcutFile(shortcutData: any, isFirstInstance?: boolean): Promise<void> {
        return new Promise((resolve) => {
            if (isFirstInstance) {
                log("Writing into shortcuts file...");
            }

            shortcut.writeFile(this.shortcutsFilePath, shortcutData, (err: Error) => {
                if (err) {
                    logError(err.message);
                    // yeah... don't ask
                    return resolve();
                }

                if (isFirstInstance) {
                    log(`${colors.cyan('Shortcut(s) updated')}, Steam restart required !`);
                }

            });
            return resolve();
        })

    }
}