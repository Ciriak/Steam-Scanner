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
        this.gameData = this.checkGameData(gameData);
        this.scanner = scanner;
        this.config = scanner.config;
    }

    /**
     * Check if some data already saved exist
     */
    private checkGameData(gameData: IGame): IGame {
        console.log(gameData)
        try {
            let gameConfig: IGame | null = null;
            if (this.gameData.name && this.gameData.launcher && this.config.launchers[this.gameData.launcher]) {
                const launcher = this.config.launchers[this.gameData.launcher];
                if (launcher && launcher.games) {
                    gameConfig = launcher.games[this.gameData.name];
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


    // if (this.gameData.binaries.length === 0) {
    //     logWarn(
    //         colors.yellow(
    //             "No executable found in the folder for " +
    //             colors.cyan(this.gameData.name) +
    //             " it has been skipped"
    //         )
    //     );
    //     return resolve(binariesPathList);
    // }

    // // if there is only one binaries, set it by default
    // if (this.gameData.binaries.length === 1) {

    //     if (this.gameData.launcher && this.config.launchers[this.gameData.launcher]) {
    //         const launcher = this.config.launchers[this.gameData.launcher];
    //         if (launcher.games) {
    //             launcher.games[this.gameData.name] = this.gameData;
    //         }
    //     }
    //     else {
    //         logWarn("Launcher not found");
    //         return;
    //     }

    //     await this.manager.setBinaryForGame(
    //         this.name,
    //         gameItem.name,
    //         binariesPathList[0],
    //         false
    //     );
    //     this.games[gameItem.name].binaries = [binariesPathList[0]];
    //     this.games[gameItem.name].userSet = true;

    //     continue;
    // }


    // TODO REDO
    // if there is more than one binary, add the list the the listenners
    // if (gameItem.binaries.length > 1) {
    //     this.config.launchers[this.name].games[gameItem.name] = this.games[
    //         gameItem.name
    //     ];

    //     /*
    //       Here, we will listen for an active process to have the same name than a binarie found in the game files
    //       add the game the the listener, things happend in "Scanner.ts"
    //     */
    //     log(
    //         "Watching " +
    //         colors.cyan("" + gameItem.binaries.length + "") +
    //         " executable files for the game " +
    //         colors.cyan(gameItem.name)
    //     );
    // }
}