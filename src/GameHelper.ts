import { log, logWarn, logError } from "./utils/helper.utils";
import SteamScanner from "./app";
import Config from "./Config";
import recursive from "recursive-readdir";
import colors from "colors";
import path from "path";
import exeBlackList from "./library/ExeBlackList";
import { findIndex } from "lodash";
import gamesLibrary from "./library/games/GamesLibrary"
import IGame from "./interfaces/Game.interface";
import defaultIcon from "./assets/scanner.png";
import { exists } from "fs-extra";
/**
 * Provide utilities for game manipulations
 */
export default class GameHelper {
    gameData: IGame;
    scanner: SteamScanner;
    config: Config;
    constructor(gameData: IGame, scanner: SteamScanner) {
        this.scanner = scanner;
        this.config = scanner.config;
        this.gameData = gameData;
        this.checkGameData();
    }



    /**
     * Check if some data already saved exist for the game
     */
    private async checkGameData(): Promise<IGame> {
        return new Promise(async (resolve) => {
            try {
                let gameConfig: IGame | null = null;
                if (this.gameData.name && this.gameData.launcher && this.config.launchers[this.gameData.launcher]) {
                    const launcher = this.config.launchers[this.gameData.launcher];
                    if (launcher && launcher.games) {
                        gameConfig = launcher.games[this.gameData.name];
                        if (gameConfig) {
                            // if a config is found for this game, return it
                            this.gameData = gameConfig;
                            return resolve(gameConfig);
                        }
                    }
                }

                // else return the original provided config
                return resolve(this.gameData)
            } catch (error) {
                // in case of error return the original provided config
                logWarn(error);
                return resolve(this.gameData)
            }
        })


    }

    public async getBinaries() {

        return new Promise<string[]>(async (resolve) => {

            const binariesPathList: string[] = [];

            log(`Searching the executable of a possible game named ${colors.cyan(this.gameData.name)}...`);


            // Check if the game binary has been set already
            // or if the game should be skipped
            if (
                this.gameData.binarySet || this.gameData.hidden
            ) {
                // skip the game
                return resolve(binariesPathList);
            }

            let filesList: string[] = await recursive(this.gameData.folderPath);
            filesList = this.removeDuplicatedFiles(filesList);
            filesList = this.filterFromBlackList(filesList);

            // Check all the files in the found directory
            // if one of the file is contained in the game.binaries properties, it is set as the game default binary
            filesListLoop: for (const fileName of filesList) {
                for (const binary of this.gameData.binaries) {
                    if (fileName.search(binary) > -1) {
                        binariesPathList.push(fileName);
                        log(colors.green(fileName + " FOUND !"));
                        break filesListLoop; // stop everything, we found what we want, a known game executable
                    }
                }

                // reference all executables
                if (path.extname(fileName) === ".exe") {
                    binariesPathList.push(fileName);
                }
            }

            return resolve(binariesPathList);

        })
    }

    /**
     * Send a label for the given game
     * @param game game data
     */
    public getLabel(gameData: IGame) {

        let label = gameData.name;
        // if the game name contain no space, convert camelCase to titleCase
        if (!(/\s/.test(gameData.name))) {
            label = this.camelCaseToTitleCase(gameData.name)
        }

        return label;
    }

    /**
     * Try to find the game executable using the binaries list
     */
    public async findGameExecutable(): Promise<void> {

        return new Promise((resolve) => {


            /**
             * Try to find a reference executable in the library
             */
            this.gameData = this.checkExecutableInLibrary(this.gameData);

            // stop if binary set from the library
            if (this.gameData.binarySet) {
                return resolve();
            }

            switch (this.gameData.binaries.length) {
                // no binary found
                case 0:
                    logWarn(
                        colors.yellow(
                            "No executable found in the folder for " +
                            colors.cyan(this.gameData.name) +
                            " it has been skipped"
                        )
                    );
                    return resolve();
                // 1 binary found
                case 1:
                    if (this.gameData.launcher && this.config.launchers[this.gameData.launcher]) {
                        const launcher = this.config.launchers[this.gameData.launcher];

                        if (launcher.games) {
                            this.gameData.binaries = [this.gameData.binaries[0]];
                            log(colors.green("Found the executable of " + colors.cyan(this.gameData.name) + " at ") + this.gameData.binaries[0]);

                            // only if the game is authorized to be auso added
                            if (this.gameData.disableAutoAdd) {
                                logWarn("Disable auto add is set to TRUE for " + this.gameData.name + ", the exe will have to be manually set by the user");
                            }
                            else {
                                this.scanner.launchersManager.setBinaryForGame(this.gameData);
                            }

                        }
                    }
                    else {
                        logWarn("Launcher not found");
                        return resolve();
                    }

                    return resolve();

                // More than 1 binaries found
                default:
                    if (this.gameData.launcher && this.config.launchers[this.gameData.launcher]) {
                        const launcher = this.config.launchers[this.gameData.launcher];
                        if (launcher && launcher.games) {
                            launcher.games[this.gameData.name] = this.gameData;
                        }
                    }

                    /*
                      Here, we will listen for an active process to have the same name than a binarie found in the game files
                      add the game the the listener, things happend in "Scanner.ts"
                    */
                    log(`Found ${colors.cyan(String(this.gameData.binaries.length))} possible executable(s) for the game ${colors.cyan(this.gameData.name)}`);

                    this.scanner.notificationsManager.notification({
                        icon: defaultIcon,
                        title: "Manual exe selection needed",
                        message: `We found various possible executables for ${this.gameData.label}, click on this notification to select the correct one`,
                        shouldOpenMenu: true
                    })



                    return resolve();
            }

        });

    }

    /**
     * Check if a game is still installed on the computer
     *
     * If not, remove it's shortcut
     * @param game
     * @return refreshed game data or null if the game is not available anymore
     */
    public checkGameInstallation(): Promise<boolean> {
        const game = this.gameData;
        return new Promise((resolve) => {
            // check the game folder
            exists(game.folderPath, async (folderExist) => {
                if (!folderExist) {
                    logWarn(`Game folder for ${game.label} don't exists anymore... it's shortcut will be removed`);
                    return resolve(false);
                }

                // check the game exe
                if (game.binarySet) {
                    exists(game.binaries[0], async (binaryExist) => {
                        if (!binaryExist) {
                            logWarn(`Executable for ${game.label} don't exists anymore... it's shortcut will be removed and the game data refreshed`);
                            await this.scanner.steam.removeShortcut(game);
                            // update the game instance
                            this.gameData.binarySet = false;
                            this.gameData.disableAutoAdd = true;
                            // return true (since the game is still installed)
                            return resolve(true);
                        }
                    });
                }

                return resolve(true);

            });
        });
    }

    /**
     * Check if we know the game in the "library" if so, we set the stored properties
     */
    private checkExecutableInLibrary(game: IGame): IGame {
        if (!gamesLibrary[game.name]) {
            return game;
        }

        const libraryGameInfos = gamesLibrary[game.name];

        gameFilesloop: for (const binary of game.binaries) {
            for (const libBinary of libraryGameInfos.binaries) {
                if (path.basename(binary) === path.basename(libBinary)) {
                    game.binaries = [binary];
                    if (!game.disableAutoAdd) {
                        this.scanner.launchersManager.setBinaryForGame(this.gameData);
                    }
                    break gameFilesloop;
                }
            }
        }

        game.label = libraryGameInfos.label || game.label;

        return game;
    }



    /**
     * Take a list of binaries files and add the full game path to each of them
     * @param game game object
     * @param filesList exe path list
     */
    private addFolderPathToBinariesList(game: IGame, filesList: string[]) {
        const parsedList: string[] = [];
        for (const filePath of filesList) {
            parsedList.push(path.join(game.folderPath, filePath));
        }
        return parsedList;
    }

    /**
     * Remove the blacklisted executables from a executables list
     * @param list list of file path
     */
    private filterFromBlackList(list: string[]) {
        const parsedList: string[] = [];
        for (const filePath of list) {
            let valid = true;
            for (const blacklistedExe of exeBlackList) {
                if (filePath.search(blacklistedExe) > -1) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                parsedList.push(filePath);
            }
        }
        return parsedList;
    }

    /**
     * Remove the duplicated entries from a file list (based on their filename and not the full path)
     *
     * @param list
     */
    private removeDuplicatedFiles(list: string[]) {
        const filePathCollection: {
            path: string;
            base: string;
        }[] = [];
        const parsedPath: string[] = [];

        for (const filePath of list) {
            const i = findIndex(filePathCollection, {
                base: path.basename(filePath)
            });
            if (i === -1) {
                filePathCollection.push({
                    base: path.basename(filePath),
                    path: filePath
                });
            }
        }

        for (const entry of filePathCollection) {
            parsedPath.push(entry.path);
        }

        return parsedPath;
    }

    private camelCaseToTitleCase(input: string) {
        const result = input                         // "ToGetYourGEDInTimeASongAboutThe26ABCsIsOfTheEssenceButAPersonalIDCardForUser456InRoom26AContainingABC26TimesIsNotAsEasyAs123ForC3POOrR2D2Or2R2D"
            .replace(/([a-z])([A-Z][a-z])/g, "$1 $2")           // "To Get YourGEDIn TimeASong About The26ABCs IsOf The Essence ButAPersonalIDCard For User456In Room26AContainingABC26Times IsNot AsEasy As123ForC3POOrR2D2Or2R2D"
            .replace(/([A-Z][a-z])([A-Z])/g, "$1 $2")           // "To Get YourGEDIn TimeASong About The26ABCs Is Of The Essence ButAPersonalIDCard For User456In Room26AContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
            .replace(/([a-z])([A-Z]+[a-z])/g, "$1 $2")          // "To Get Your GEDIn Time ASong About The26ABCs Is Of The Essence But APersonal IDCard For User456In Room26AContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
            .replace(/([A-Z]+)([A-Z][a-z][a-z])/g, "$1 $2")     // "To Get Your GEDIn Time A Song About The26ABCs Is Of The Essence But A Personal ID Card For User456In Room26A ContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
            .replace(/([a-z]+)([A-Z0-9]+)/g, "$1 $2")           // "To Get Your GEDIn Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC26Times Is Not As Easy As 123For C3POOr R2D2Or 2R2D"

            // Note: the next regex includes a special case to exclude plurals of acronyms, e.g. "ABCs"
            .replace(/([A-Z]+)([A-Z][a-rt-z][a-z]*)/g, "$1 $2") // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC26Times Is Not As Easy As 123For C3PO Or R2D2Or 2R2D"
            .replace(/([0-9])([A-Z][a-z]+)/g, "$1 $2")          // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC 26Times Is Not As Easy As 123For C3PO Or R2D2Or 2R2D"

            // Note: the next two regexes use {2,} instead of + to add space on phrases like Room26A and 26ABCs but not on phrases like R2D2 and C3PO"
            .replace(/([A-Z]{2,})([0-9]{2,})/g, "$1 $2")        // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456 In Room 26A Containing ABC 26 Times Is Not As Easy As 123 For C3PO Or R2D2 Or 2R2D"
            .replace(/([0-9]{2,})([A-Z]{2,})/g, "$1 $2")        // "To Get Your GED In Time A Song About The 26 ABCs Is Of The Essence But A Personal ID Card For User 456 In Room 26A Containing ABC 26 Times Is Not As Easy As 123 For C3PO Or R2D2 Or 2R2D"
            .trim();


        // capitalize the first letter
        return result.charAt(0).toUpperCase() + result.slice(1);
    }



}