import colors from "colors";
import fs from "fs-extra";
import path from "path";
import Config from "./Config";
import ILauncher, { IGameLocation, IInstallationState, IGamesCollection } from "./interfaces/Launcher.interface";
import { addDrivesToPossibleLocations, log, logWarn } from "./utils/helper.utils";
import GameHelper from "./GameHelper";
import SteamScanner from "./app";

export abstract class Launcher implements ILauncher {
    [propName: string]: any
    private config: Config;
    public name: string = "Launcher";
    public label: string = "Launcher";
    public exeName: string = "Launcher.exe";
    public exeLocation?: string;
    public exePossibleLocations: string[] = [];
    public gamesPossibleLocations?: IGameLocation;
    public games: IGamesCollection = {};

    public readonly icon: string = "";

    /**
     * Displayed name of the launcher
     */
    protected nameLabel: string = "Launcher";
    /**
     * Reference to the scanner instance
     */
    private scanner: SteamScanner;

    constructor(scanner: SteamScanner) {
        this.scanner = scanner;
        this.config = scanner.config;
    }

    /**
     * Retrieve the saved data for this launcher and apply them
     */
    protected hydrateFromConfig() {

        if (!this.config.launchers[this.name]) {
            // nothing to apply
            return;
        }
        for (const prop in this.config.launchers[this.name]) {
            if (this.config.launchers[this.name].hasOwnProperty(prop)) {

                const val = this.config.launchers[this.name][prop];
                // set the class prop with the saved value
                this[prop] = val;
            }
        }

        this.nameLabel = colors.cyan("[" + this.name + "]");
    }

    /**
     * Check if the launcher is installed on the machine
     * @return Promise with a boolean
     */
    public async checkInstallation(): Promise<IInstallationState> {
        log(`${this.nameLabel} Checking installation...`);
        return new Promise(async (resolve) => {
            // if the binary location is not defined, try to find it
            if (this.exeName && this.exeLocation) {
                // if the exe still exists
                if (fs.existsSync(this.exeLocation)) {
                    log(`${this.nameLabel} is installed in ${colors.magenta(this.exeLocation)}`);
                    return resolve({
                        launcher: this,
                        installed: true
                    });
                }
                else {
                    logWarn(`${this.nameLabel} executable is missing !`);
                }
            }

            const parsedPossibleLocations: string[] = await addDrivesToPossibleLocations(
                this.exePossibleLocations
            );

            // first we locate the launcher directory
            for (let loc of parsedPossibleLocations) {
                loc = path.normalize(path.join(loc, this.exeName));
                // check if the launcher exe exists
                if (fs.existsSync(loc)) {

                    // set the exeLocation propertie
                    this.exeLocation = loc;
                    break;
                }
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
    protected async loadGamesDirectories(): Promise<any> {
        let count: number = 0;

        return new Promise(async (resolve) => {

            // skip if no game directory registered for this launcher (ex: Battle.net)
            if (!this.gamesPossibleLocations) {
                return resolve();
            }

            log(`${this.nameLabel} Looking for game directories...`);

            for (const possibleLocation of this.gamesPossibleLocations.include) {
                const locationPathList = await addDrivesToPossibleLocations([
                    possibleLocation
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

                            // check if the "game" folder name is in the exclude list$
                            if (this.isInGamesExcludeList(parsedGameDir.name)) {
                                continue;
                            }

                            // check if the game already exist in the list
                            // skip if this is the case
                            if (this.games[parsedGameDir.name]) {
                                continue;
                            }

                            this.games[parsedGameDir.name] = {
                                name: parsedGameDir.name,
                                label: parsedGameDir.name,
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
    protected async loadGamesBinaries(): Promise<any> {
        return new Promise(async (resolve) => {
            for (const gameName in this.games) {
                // only search if binary is not set yet
                if (this.games.hasOwnProperty(gameName)) {
                    const gameData = this.games[gameName];

                    const gameInstance = new GameHelper(this.games[gameName], this.scanner);

                    // force a label refresh every time
                    this.games[gameName].label = gameInstance.getLabel(this.games[gameName]);

                    // stop if we should ignore the game
                    if (gameData.binarySet || gameData.hidden) {
                        continue;
                    }
                    this.games[gameName].binaries = await gameInstance.getBinaries();


                    await gameInstance.findGameExecutable();
                }
            }

            resolve();

        });

    }

    protected isInGamesExcludeList(gameFolderName: string): boolean {
        // no exclude // return false
        if (!this.gamesPossibleLocations?.exclude) {
            return false;
        }
        for (const ignoredLocation of this.gamesPossibleLocations?.exclude) {
            if (ignoredLocation === gameFolderName) {
                // The folder name should be ignored // return true
                return true;
            }
        }

        return false;
    }
}
