import { log, logError, addDrivesToPossibleLocations } from "./utils/helper.utils";
import Config from "./Config";
import path from "path";
import { lstatSync, readdirSync, exists, existsSync } from "fs-extra";
import { SteamUser } from "./SteamUser";
import SteamScanner from "./app";
import colors from "colors";
import { exec, execFile } from "child_process";
import { app } from "electron";
import IGame from "./interfaces/Game.interface";
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

            // try to get steam directory
            this.config.steamDirectory = await this.getSteamDirectory();
            this.config.steamExe = await this.getSteamExecutable();

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

            log(colors.cyan(userDirectories.length + " Steam account(s) found"));

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

    public async getSteamExecutable(): Promise<string> {
        const exePath = path.join(this.config.steamDirectory, "steam.exe");
        return new Promise((resolve) => {
            if (existsSync(exePath)) {
                return resolve(exePath);
            }
            else {
                logError("FATAL error, unable to locate the Steam executable !");
                app.quit();
            }
        });
    }

    /**
     * Update the shortcuts for EACH user
     */
    public async updateShortcuts(): Promise<void> {
        return new Promise(async (resolve) => {
            let first = true;
            for (const user of this.steamUsers) {
                await user.updateShortcuts(first);
                if (first) {
                    first = false;
                }
            }

            if (this.config.autoRestartSteam) {
                this.restartSteam();
            }


            return resolve();
        })
    }

    /**
     * Update a shortcut for EACH user
     */
    public async removeShortcut(game: IGame): Promise<void> {
        return new Promise(async (resolve) => {
            let first = true;
            for (const user of this.steamUsers) {
                await user.removeShortcut(game, first);
                if (first) {
                    first = false;
                }
            }

            if (this.config.autoRestartSteam) {
                this.restartSteam();
            }

            return resolve();
        })
    }

    /**
     * Restart the steam client process
     */
    public restartSteam() {
        log(colors.magenta("Retarting the Steam client..."));
        this.getSteamDirectory()
        // kill the active steam process
        exec('taskkill /f /IM "steam.exe"');
        // launch the exe
        setTimeout(() => {
            execFile("steam.exe", null, {
                cwd: this.config.steamDirectory
            });
        }, 3000);

    }
}