import { app } from "electron";
import * as path from "path";
import { Launcher } from "./Launcher";
import SteamScanner from "./app";
import { logError, log } from "./utils/helper.utils";
import launchers from "./library/launchers/LaunchersList";
import Config from "./Config";
import { IInstallationState, IGamesCollection } from "./interfaces/Launcher.interface";

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
                    const launcherConfig = launchers[launcherName];
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
                resolve(installedLaunchers);
            });


        })



    }

    /**
     * set the given binary the main one for the given game and save it
     * @param launcherName
     * @param gameName
     * @param binaryPath
     * @param userSet has been set manually buy the user ?
     */
    public async setBinaryForGame(
        launcherName: string,
        gameName: string,
        binaryPath: string,
        userSet: boolean // manually set by the user, wont apply the other rules
    ) {
        try {
            // set the binary
            if (this.config.launchers[launcherName]) {
                const launcher = this.config.launchers[launcherName];
                if (launcher.games && launcher.games[gameName]) {
                    launcher.games[gameName].binaries = [
                        binaryPath
                    ];
                    // set the userSet propertie if given
                    if (userSet) {
                        launcher.games[gameName].userSet = true
                    }
                }
            }
        } catch (error) {
            logError(error);
        }

        // retrieve the icon and generate a file
        await this.generateGameIcon(binaryPath, launcherName, gameName);

        return new Promise((resolve) => {
            resolve();
        });
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
