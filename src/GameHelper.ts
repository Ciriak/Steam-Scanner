import { log, logWarn } from "./utils/helper.utils";
import SteamScanner from "./app";
import Config from "./Config";
import recursive from "recursive-readdir";
import colors from "colors";
import path from "path";
import exeBlackList from "./library/ExeBlackList";
import { findIndex } from "lodash";
import gamesLibrary from "./library/games/GamesLibrary"
import IGame from "./interfaces/Game.interface";
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
        this.gameData = this.checkGameData(gameData);
    }



    /**
     * Check if some data already saved exist
     */
    private checkGameData(gameData: IGame): IGame {
        try {
            let gameConfig: IGame | null = null;
            if (gameData.name && gameData.launcher && this.config.launchers[gameData.launcher]) {
                const launcher = this.config.launchers[gameData.launcher];
                if (launcher && launcher.games) {
                    gameConfig = launcher.games[gameData.name];
                    if (gameConfig) {
                        // if a config is found for this game, return it
                        return gameConfig
                    }
                }
            }
            // else return the original provided config
            return gameData
        } catch (error) {
            logWarn(error);
            return gameData
        }

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
     * Try to find the game executable using the binaries list
     */
    public async findGameExecutable(): Promise<any> {

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
                    // notifier.notify({
                    //     title: "Game found",
                    //     message: `We have found ${this.gameData.binaries.length} files that can be the game executable, please select one`
                    // })

                    return resolve();
            }

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



}