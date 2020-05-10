import { app, dialog } from "electron";
import * as path from "path";
import { Launcher } from "./Launcher";
import SteamScanner from "./app";
import { logError, log, logWarn } from "./utils/helper.utils";
import Config from "./Config";
import ILauncher, { IInstallationState, IGamesCollection } from "./interfaces/Launcher.interface";
import colors from "colors";
import BattleNet from "./library/launchers/BattleNet";
import Origin from "./library/launchers/Origin";
import Uplay from "./library/launchers/Uplay";
import Epic from "./library/launchers/Epic";
import IGame from "./interfaces/Game.interface";

export class LaunchersManager {
    private config: Config;
    public installedLaunchers: Launcher[] = [];
    public scanner: SteamScanner;
    private launchersList: Launcher[] = []
    /**
     * retrieve the supported launchers list from library (not an actual scan)
     * retrieve the "unique" games config from the library
     */
    constructor(scanner: SteamScanner) {
        this.scanner = scanner;
        this.config = scanner.config;
        /**
         * Set the launchers list
         */
        this.launchersList = [
            new BattleNet(this.scanner),
            new Origin(this.scanner),
            new Uplay(this.scanner),
            new Epic(this.scanner),
        ]
    }

    /**
     * Update the games list for all launchers and return all games
     */
    public async getAllGames(): Promise<IGamesCollection> {
        return new Promise((resolve) => {
            let gamesList: IGamesCollection = {};
            // get games from all installed Launcher
            const waitList: Promise<IGamesCollection>[] = [];
            for (const launcher of this.installedLaunchers) {

                const isLibrary = launcher.name === "Library";
                waitList.push(launcher.getGames());
            }

            Promise.all(waitList).then((results) => {
                for (const result of results) {
                    gamesList = { ...result };
                }
                return resolve(gamesList);
            });
        });


    }

    /**
     * Return a list of all found launchers (other than steam)
     * Also add a "Library" categorie for games founds from the library
     */
    public async detectAllLaunchers(): Promise<Launcher[]> {
        return new Promise((resolve) => {

            const checkList: Promise<IInstallationState>[] = [];
            // list installed LauncherS
            log("Checking installed Launchers...");

            for (const launcher of this.launchersList) {
                checkList.push(launcher.checkInstallation())
            }

            const installedLaunchers: Launcher[] = [];
            Promise.all(checkList).then((status) => {
                for (const state of status) {
                    if (state.installed) {
                        installedLaunchers.push(state.launcher);
                    }
                }
                // Set the launchers list
                this.installedLaunchers = installedLaunchers;
                this.setInstalledLaunchers(installedLaunchers);
                resolve(installedLaunchers);
            });
        })
    }

    /**
     * Save the instaled launchers into the config
     * @param installedLaunchers
     */
    private setInstalledLaunchers(installedLaunchers: Launcher[]) {
        const parsedLaunchers: { [key: string]: ILauncher } = {};
        for (const launcher of installedLaunchers) {
            parsedLaunchers[launcher.name] = {
                exeName: launcher.exeName,
                exePossibleLocations: launcher.exePossibleLocations,
                name: launcher.name,
                label: launcher.label,
                games: launcher.games,
                gamesPossibleLocations: launcher.gamesPossibleLocations,
                exeLocation: launcher.exeLocation,
                icon: launcher.icon
            }
        }
        this.config.launchers = parsedLaunchers;
    }

    /**
     * set the given binary the main one for the given game and save it
     * @param launcherName
     * @param gameName
     * @param binaryPath
     * @param userSet has been set manually buy the user ?
     */
    public async setBinaryForGame(
        gameData: IGame,
        userSet?: boolean // manually set by the user, wont apply the other rules
    ): Promise<void> {
        return new Promise(async (resolve) => {

            // set the binary
            if (!this.config.launchers[gameData.launcher]) {
                logWarn(`Cannot continue, launcher ${gameData.launcher} not found !`);
                return resolve();
            }
            const launcher = this.config.launchers[gameData.launcher];

            if (launcher.games && launcher.games[gameData.name]) {
                launcher.games[gameData.name].binaries = gameData.binaries;
                // set the userSet propertie if given
                if (userSet) {
                    launcher.games[gameData.name].userSet = true
                }

                launcher.games[gameData.name].binarySet = true
            }

            // retrieve the icon and generate a file
            await this.generateGameIcon(gameData.binaries[0], gameData.launcher, gameData.name);

            // commit the changes
            this.config.launchers[gameData.launcher] = launcher;
            this.config.launchers = { ...this.config.launchers };

            log(`${colors.cyan(gameData.name)} executable has been set as : ${colors.green(gameData.binaries[0])}`);

            // show notification
            const gameIcon = this.scanner.IconsUtil.getIcon(gameData.binaries[0])[64];

            // little timeout for the image loading

            this.scanner.notificationsManager.notification({
                icon: gameIcon,
                title: gameData.name + " added",
                message: gameData.name + " has been added to your Steam library",
            });



            this.scanner.steam.updateShortcuts();

            // retrieve the grid if the option is enabled
            if (this.config.enableGrid) {
                this.scanner.gridManager.getGrid();
            }

            resolve();
        });
    }

    /**
     * Hide and ignore this game in the future
     * @param game
     */
    public ignoreGame(gameData: IGame) {
        dialog.showMessageBox({
            title: "Hiding " + gameData.name,
            type: "question",
            message: "Are you sure you want to ignore this game ?\nIt will not appear in the list in the future.",
            buttons: ["Yes", "No"],
        }).then((response) => {
            // if user said yes
            if (response.response === 0) {
                if (!this.config.launchers[gameData.launcher]) {
                    logWarn(`Cannot continue, launcher ${gameData.launcher} not found !`);
                    return;
                }
                const launcher = this.config.launchers[gameData.launcher];

                if (launcher.games && launcher.games[gameData.name]) {
                    // set the ignore propertie
                    launcher.games[gameData.name].hidden = true
                    // commit the changes
                    this.config.launchers[gameData.launcher] = launcher;
                    this.config.launchers = { ...this.config.launchers };
                    log(`${colors.cyan(gameData.name)} has been added to the ignore list`)
                }
            }

        });



    }

    /**
     * Remove the game from the steam Library
     * @param game
     */
    public resetGame(gameData: IGame) {

        if (!this.config.launchers[gameData.launcher]) {
            logWarn(`Cannot continue, launcher ${gameData.launcher} not found !`);
            return;
        }
        const launcher = this.config.launchers[gameData.launcher];

        if (launcher.games && launcher.games[gameData.name]) {
            // clear the game binaries
            launcher.games[gameData.name].binaries = [];
            launcher.games[gameData.name].binarySet = false;
            launcher.games[gameData.name].hideNotifications = true;
            launcher.games[gameData.name].disableAutoAdd = true;
            // commit the changes
            this.config.launchers[gameData.launcher] = launcher;
            this.config.launchers = { ...this.config.launchers };
            log(`${colors.cyan(gameData.name)} infos have been cleaned`)

            this.scanner.steam.removeShortcut(gameData).then(() => {
                this.scanner.notificationsManager.notification({
                    title: "Game removed",
                    message: `${gameData.name} has been removed from your Steam Library`,
                })
                // relaunch a scan process
                this.getAllGames().then(() => {
                    this.scanner.trayManager.setTray();
                })
            });



        }


    }

    /**
     * Try to retrieve the game icon from his found binaries
     */
    private async generateGameIcon(
        binaryPath: string,
        launcherName: string,
        gameName: string
    ) {
        const iconBasePath = path.join(
            app.getPath("appData"),
            "Steam Scanner",
            "icons"
        );

        const smallIconFilePath = path.join(iconBasePath, gameName, "16X16.png");
        const mediumIconFilePath = path.join(iconBasePath, gameName, "32X32.png");

        // find associate icon

        // try {
        //   //small icon
        //   fs.ensureFileSync(smallIconFilePath);

        //   fs.ensureFileSync(mediumIconFilePath);

        //   //dirty af :(
        //   getIconForPath(binaryPath, ICON_SIZE_EXTRA_SMALL, function(
        //     err,
        //     smallIconData
        //   ) {
        //     if (err) {
        //      logError(err);
        //     }
        //     fs.writeFileSync(smallIconFilePath, smallIconData);
        //     getIconForPath(binaryPath, ICON_SIZE_SMALL, function(
        //       err,
        //       mediumIconData
        //     ) {
        //       if (err) {
        //        logError(err);
        //       }
        //       fs.writeFileSync(mediumIconFilePath, mediumIconData);
        //     });
        //   });
        // } catch (err) {
        //  logError(err);
        //   return new Promise((resolve) => {
        //     resolve();
        //   });
        // }

        // save it into the config

        try {

            if (this.config.launchers[launcherName]) {
                const launcher = this.config.launchers[launcherName];
                if (launcher.games && launcher.games[gameName]) {
                    launcher.games[gameName].iconPath = {
                        16: smallIconFilePath,
                        32: mediumIconFilePath
                    }
                }
            }
        } catch (error) {
            logError(error);
        }

        return new Promise((resolve) => {
            resolve();
        });
    }
}
