import colors from "colors";
import * as fs from "fs-extra";
import * as path from "path";
import Config from "./Config";
import { LaunchersManager } from "./LaunchersManager";
import ILauncher, { IGameLocation, IInstallationState, IGamesCollection } from "./interfaces/Launcher.interface";
import { addDrivesToPossibleLocations, log, logWarn, logError } from "./utils/helper.utils";
import Game from "./GameHelper";
import SteamScanner from "./app";

export class Launcher implements ILauncher {
    private config: Config;
    public name: string;
    private nameLabel: string;
    public exeName: string = "";
    public exeLocation: string = "";

    /**
     * List of games found for this launcher
     */
    public games: IGamesCollection = {};
    private manager: LaunchersManager;
    private scanner: SteamScanner;
    public exePossibleLocations: string[] = [];
    public gamesPossibleLocations?: IGameLocation[] = [];

    constructor(launcherItem: ILauncher, manager: LaunchersManager, scanner: SteamScanner) {
        this.manager = manager;
        this.scanner = scanner;
        this.config = scanner.config;
        this.name = launcherItem.name;
        this.nameLabel = colors.cyan("[" + this.name + "]");
        this.exePossibleLocations = launcherItem.exePossibleLocations;
        this.gamesPossibleLocations = launcherItem.gamesPossibleLocations;
        this.exeName = launcherItem.exeName;
    }

    /**
     * Check if the launcher is installed on the machine
     * @return Promise with a boolean
     */
    public async checkInstallation(): Promise<IInstallationState> {
        log("Checking installation for " + this.name);
        return new Promise(async (resolve) => {
            let launcherConfig: any = this.config.launchers[this.name];
            // if the binary location is not defined, try to find it
            if (!launcherConfig || !launcherConfig.exeLocation) {
                const parsedPossibleLocations: string[] = await addDrivesToPossibleLocations(
                    this.exePossibleLocations
                );

                // first we locate the drm directory
                for (let loc of parsedPossibleLocations) {
                    loc = path.normalize(path.join(loc, this.exeName));
                    // try to list all the users in the userdata folder of steam
                    if (fs.existsSync(loc)) {
                        this.exeLocation = loc;

                        try {
                            launcherConfig = this;
                            // this.config.save();
                        } catch (error) {
                            logError(error);
                        }
                        break;
                    }
                }
            } else {
                this.exeLocation = launcherConfig.exeLocation;
            }

            if (this.exeLocation) {
                log(`${colors.green(this.name + " found")} in ${this.exeLocation}`);
                return resolve({
                    launcher: this,
                    installed: true
                });
            } else {
                logWarn(this.name + " not found");
                return resolve({
                    launcher: this,
                    installed: false
                });
            }


        });
    }

    /**
     * Scan and return the games list of this launcher
     */
    public async getGames(): Promise<IGamesCollection> {
        return new Promise(async (resolve) => {
            await this.loadGamesDirectories();
            await this.loadGamesBinaries();
            return resolve(this.games);
        })

    }

    /**
     * Load the game directories into the class
     */
    private async loadGamesDirectories(): Promise<any> {

        let count: number = 0;

        return new Promise(async (resolve) => {

            // skip if no game directory registered for this launcher (ex: Battle.net)
            if (!this.gamesPossibleLocations) {
                return resolve();
            }

            log(`${this.nameLabel} Looking for game directories...`);

            for (const possibleLocation of this.gamesPossibleLocations) {
                const locationPathList = await addDrivesToPossibleLocations([
                    possibleLocation.path
                ]);



                for (const locationPath of locationPathList) {
                    // Directory of games
                    try {
                        const items = fs.readdirSync(locationPath);

                        for (const dir of items) {
                            const currentGameDir = path.normalize(path.join(locationPath, dir));

                            // skip if this is not a folder
                            if (!fs.lstatSync(currentGameDir).isDirectory()) {
                                continue;
                            }

                            // TODO probably need to better check here if the folder is indeed a game folder
                            const parsedGameDir = path.parse(currentGameDir);
                            // check if the game already exist in the list
                            this.games[parsedGameDir.name] = {
                                name: parsedGameDir.name,
                                folderPath: currentGameDir,
                                binaries: [],
                                launcher: this.name
                            };

                            count++;

                        }

                        // skip if the possible game folder don't exist
                    } catch (e) {
                        continue;
                    }
                }
            }

            log(`${this.nameLabel} ${count} possible game folder(s) found`);

            resolve();
        });
    }


    /**
     * Load the game binaries into the game instances
     */
    private async loadGamesBinaries(): Promise<any> {
        return new Promise(async (resolve) => {
            for (const gameName in this.games) {

                if (this.games.hasOwnProperty(gameName)) {
                    const gameInstance = new Game(this.games[gameName], this.scanner);
                    this.games[gameName].binaries = await gameInstance.getBinaries();
                }
            }

            resolve();

        });

    }



    /**
     * Check if a given folder correspond to a game referenced in the games library
     * If true, try to find the associated launcher
     * @param checkedDirName name of the current checked directory
     */
    // private checkLibraryGamesFolders(parsedDirectory: path.ParsedPath) {
    //     const checkIndex = _.indexOf(this.manager.scanner.libraryGames, {
    //         folderPath: parsedDirectory.name
    //     });
    //     for (
    //         let libraryGameIndex = 0;
    //         libraryGameIndex < this.manager.scanner.libraryGames.length;
    //         libraryGameIndex++
    //     ) {
    //         const libraryGame = this.manager.scanner.libraryGames[libraryGameIndex];
    //         if (
    //             libraryGame.folderName === parsedDirectory.name ||
    //             libraryGame.name === parsedDirectory.name
    //         ) {
    //             log(
    //                 "The game " +
    //                 colors.cyan(libraryGame.name) +
    //                 " has been detected, validating ..."
    //             );
    //             // The game is referenced in the library, add it to his launcher if it exist on this system
    //             if (this.checkIfgameCanBeAdded(parsedDirectory, libraryGame)) {
    //                 libraryGame.folderPath = path.join(
    //                     parsedDirectory.dir,
    //                     parsedDirectory.base
    //                 );
    //                 libraryGame.binaries = [
    //                     path.join(libraryGame.folderPath, libraryGame.binaries[0])
    //                 ];
    //                 // all check passed, add it to the corresponding launcher
    //                 try {
    //                     config.launchers[libraryGame.launcher].games[
    //                         libraryGame.name
    //                     ] = libraryGame;
    //                 } catch (error) {
    //                     logError(error);
    //                     return false;
    //                 }
    //             }

    //             break;
    //         }
    //     }
    // }

    // private checkIfgameCanBeAdded(
    //     parsedDirectory: path.ParsedPath,
    //     libraryGame: IGame
    // ): boolean {
    //     // TODO Allow games without launchers

    //     // refused because the game dont have a known launcher
    //     if (!libraryGame.launcher) {
    //         logWarn(
    //             "Unable to add " +
    //             colors.cyan(libraryGame.name) +
    //             " : no launcher referenced ..."
    //         );
    //         return false;
    //     }
    //     // refused because the game launcher doesn't exist in this system
    //     if (!config.launchers[libraryGame.launcher]) {
    //         logWarn(
    //             "Unable to add " +
    //             colors.cyan(libraryGame.name) +
    //             " : " +
    //             libraryGame.launcher +
    //             " is not detected on this system ..."
    //         );
    //         return false;
    //     }

    //     // refused because the game doesn't have a valid binary target
    //     if (!libraryGame.binaries || !libraryGame.binaries[0]) {
    //         logWarn(
    //             "Unable to add " +
    //             colors.cyan(libraryGame.name) +
    //             " : " +
    //             " No binary referenced ..."
    //         );
    //         return false;
    //     }

    //     // check if the binary referenced in the library exist in this system
    //     const checkBinaryPath = path.join(
    //         parsedDirectory.dir,
    //         parsedDirectory.base,
    //         libraryGame.binaries[0]
    //     );

    //     // refused because the binary referenced doesn't exist in the target folder
    //     if (!fs.existsSync(checkBinaryPath)) {
    //         logWarn(
    //             "Unable to add " +
    //             colors.cyan(libraryGame.name) +
    //             " : " +
    //             " The file " +
    //             checkBinaryPath +
    //             " doesn't exist ..."
    //         );
    //         return false;
    //     }

    //     return true;
    // }
}
