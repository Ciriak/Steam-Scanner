
import * as fs from "fs-extra";
import * as path from "path";

const drivelist = require("drivelist");

import { DRMManager } from "./DRMManager";
import { SteamUser } from "./SteamUser";

const possibleSteamLocations = [
    "$drive\\Program Files (x86)\\Steam",
    "$drive\\Programmes\\Steam"
];

const shortcutsConfigPath = "userdata\\%user%\\config\\shortcuts.vdf";

export class Steamer {
    public steamDirectory: string;
    public externalGames: any;

    constructor() {
        this.checkSteamInstallation();
    }

    /**
     * Report error
     */
    public error(err: string) {
        console.error(err);
    }

    /**
     * Report log
     */
    public log(msg: string) {
        console.log(msg);
    }

    /**
     * Scan for Installed DRM and add them to steam
     */
    public updateGames() {
        const drmManager = new DRMManager(this);
        this.externalGames = drmManager.getAllGames();
    }

    /**
     * Take a list of possible location and extend it to all drive available on the machine
     * return the same object with more propertyes
     * $drive is replaced
     */

    public addDrivesToPossibleLocations(possibleLocations: string[], callback: (parsedPossibleSteamLocations: string[]) => void) {

        const mountPoints: string[] = [];
        const parsedPossibleLocations: string[] = [];
        drivelist.list((error: any, drives: any) => {
            for (const drive of drives) {
                for (const mountPoint of drive.mountpoints) {
                    mountPoints.push(mountPoint.path);
                }
            }

            for (const mountPoint of mountPoints) {
                for (const loc of possibleLocations) {
                    parsedPossibleLocations.push(path.normalize(loc.replace("$drive", mountPoint)));
                }
            }

            callback(parsedPossibleLocations);
        });

    }

    /**
     * Check if steam is installed
     */
    private checkSteamInstallation() {
        this.addDrivesToPossibleLocations(possibleSteamLocations, (parsedPossibleSteamLocations) => {
            // first we locate steam directory
            for (const loc of parsedPossibleSteamLocations) {
                // try to list all the users in the userdata folder of steam
                try {
                    const dir = path.join(loc, "userdata");
                    fs.readdirSync(dir);
                    this.steamDirectory = dir.replace("userdata", "");
                } catch (e) {
                    continue;
                }
            }
            if (!this.steamDirectory) {
                this.error("ERR_STEAM_NOT_FOUND");
                return;
            }

            this.log("Steam directory located at " + this.steamDirectory);
            this.log("Looking for steam accounts...");

            const userDirectories: string[] = [];
            const usersDir = path.join(this.steamDirectory, "userdata");
            const items = fs.readdirSync(usersDir);

            // only keep the directories
            for (const dir of items) {
                const dirPath = path.join(usersDir, dir);
                try {
                    if (fs.lstatSync(dirPath).isDirectory()) {
                        userDirectories.push(dirPath);
                    }
                } catch (e) {
                    this.error(e);
                    continue;
                }

            }

            this.log(userDirectories.length + " user(s) found");

            for (const userDir of userDirectories) {
                const userId = path.basename(userDir);
                const user = new SteamUser(userId, this);
            }
        });

    }
}
