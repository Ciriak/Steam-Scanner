import { log, logWarn } from "./utils/helper.utils";
import SteamScanner from "./app";
import Config from "./Config";
import recursive from "recursive-readdir";
import colors from "colors";
import path from "path";

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
                        // if a config is found for this game, reutrn it
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

            log(`Searching the executable of a possible game named "${this.gameData.name}"...`);


            // Check the config to see if the game and his binary are alreary known
            // if yes, skip it
            if (

                this.gameData.binaries &&
                this.gameData.binaries.length === 1
            ) {
                // skip the game
                return resolve(binariesPathList);
            }

            const filesList: string[] = await recursive(this.gameData.folderPath);
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

                            launcher.games[this.gameData.name] = this.gameData;
                        }
                    }
                    else {
                        logWarn("Launcher not found");
                        return resolve();
                    }
                    this.gameData.binaries = [this.gameData.binaries[0]];
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
                    log(`Watching ${colors.cyan(String(this.gameData.binaries.length))} executables for the game ${colors.cyan(this.gameData.name)}`);
                    return resolve();
            }

        });

    }



}