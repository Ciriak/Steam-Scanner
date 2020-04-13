import { log, logError, addDrivesToPossibleLocations } from "./utils/helper.utils";
import Config from "./Config";
import path from "path";
import { lstatSync, readdirSync } from "fs-extra";
import { SteamUser } from "./SteamUser";
import SteamScanner from "./app";
import colors from "colors";
/**
 * manage the interactions with Steam
 */
export default class Steam {

    private possibleSteamLocations = [
        "$drive\\Program Files (x86)\\Steam",
        "$drive\\Programmes\\Steam"
    ];

    private config: Config;
    private scanner: SteamScanner;
    public steamUsers: SteamUser[] = [];
    constructor(scanner: SteamScanner) {
        this.scanner = scanner;
        this.config = scanner.config;
    }

    /**
     * Check if Steam is installed on the machine
     */
    public async checkInstallation() {
        return new Promise(async (resolve) => {

            log("Checking Steam location...");

            // try to get steam directory from the config
            this.config.steamDirectory = await this.getSteamDirectory();

            log("Looking for Steam accounts...");

            const userDirectories: string[] = [];
            const usersDir = path.join(this.config.steamDirectory, "userdata");
            const items = readdirSync(usersDir);

            // only keep the directories
            for (const dir of items) {
                const dirPath = path.join(usersDir, dir);
                try {
                    if (lstatSync(dirPath).isDirectory()) {
                        userDirectories.push(dirPath);
                    }
                } catch (e) {
                    logError(e);
                    continue;
                }
            }

            log(colors.cyan(userDirectories.length + " account(s) found"));

            for (const userDir of userDirectories) {
                const userId = path.basename(userDir);
                const user = new SteamUser(userId, this.scanner);
                this.steamUsers.push(user);
            }
            resolve();
        });
    }

    /**
     * Find and send the Steam location
     */
    private async getSteamDirectory(): Promise<string> {

        return new Promise(async (resolve, reject) => {
            if (this.config.steamDirectory) {
                return resolve(this.config.steamDirectory);
            }

            const parsedPossibleSteamLocations: string[] = await addDrivesToPossibleLocations(
                this.possibleSteamLocations
            );

            // first we locate steam directory
            for (const loc of parsedPossibleSteamLocations) {
                // try to list all the users in the userdata folder of steam
                try {
                    const dir = path.join(loc, "userdata");
                    readdirSync(dir);
                    log("Steam directory located : " + colors.cyan(dir));
                    return resolve(dir.replace("userdata", ""));
                } catch (e) {
                    continue;
                }
            }

            // If steam not found, log an error and close the process
            logError("Unable to find Steam !");
            process.exit();
        })


    }

}