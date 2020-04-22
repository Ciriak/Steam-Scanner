import { app } from "electron";
import * as path from "path";
import { Launcher } from "./Launcher";
import SteamScanner from "./app";
import { logError, log, logWarn } from "./utils/helper.utils";
import launchers from "./library/LaunchersList";
import Config from "./Config";
import ILauncher, { IInstallationState, IGamesCollection } from "./interfaces/Launcher.interface";
import colors from "colors";
import notificatioReset from "./assets/notification/reset.png";


// ===== Pattern for the config file =======
// For the gamesProperties :
// %pattern% :getPath method of Electron => https://github.com/electron/electron/blob/master/docs/api/app.md#appgetpathname
// $this.xxx = a propertie of the current item (ex : name)

export class LaunchersManager {
    private config: Config;
    public installedLaunchers: Launcher[] = [];
    public scanner: SteamScanner;

    /**
     * retrieve the supported launchers list from library (not an actual scan)
     * retrieve the "unique" games config from the library
     */
    constructor(scanner: SteamScanner) {
        this.scanner = scanner;
        this.config = scanner.config;
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

            for (const launcherName in launchers) {

                if (launchers.hasOwnProperty(launcherName)) {

                    const launcherConfig = { ...this.config.launchers[launcherName], ...launchers[launcherName] }; // use the config copy of the launcher
                    const launcher = new Launcher(launcherConfig, this, this.scanner);
                    // check installation except for "library"
                    // if (launcherName === "Library") {
                    //     // add lirbary to the launchers list anyway
                    //     this.detectedLaunchers.push(launcher);
                    //     this.scanner.config.launchers[launcher.name] = launcher;
                    //     continue;
                    // }
                    checkList.push(launcher.checkInstallation())
                }
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

            this.scanner.notificationsManager.notification({
                title: gameData.name + " added",
                message: gameData.name + " has been added to your Steam library",
            });

            this.scanner.steam.updateShortcuts();



            resolve();
        });
    }

    /**
     * Hide and ignore this game in the future
     * @param game
     */
    public ignoreGame(gameData: IGame) {

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

    /**
     * Hide and ignore this game in the future
     * @param game
     */
    public resetGame(gameData: IGame) {

        if (!this.config.launchers[gameData.launcher]) {
            logWarn(`Cannot continue, launcher ${gameData.launcher} not found !`);
            return;
        }
        const launcher = this.config.launchers[gameData.launcher];

        if (launcher.games && launcher.games[gameData.name]) {
            // remove the game from the launcher list
            delete launcher.games[gameData.name]
            // commit the changes
            this.config.launchers[gameData.launcher] = launcher;
            this.config.launchers = { ...this.config.launchers };
            log(`${colors.cyan(gameData.name)} infos have been cleaned`)

            this.scanner.notificationsManager.notification({
                title: "Game info reset",
                message: gameData.name + " infos have been reset",
                icon: notificatioReset
            });

            // relaunch a scan process
            this.getAllGames().then(() => {
                this.scanner.trayManager.setTray();
            })

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
