import * as fs from "fs-extra";
import * as path from "path";

const possibleSteamLocations = [
    "C:\\Program Files (x86)\\Steam"
];

const shortcutsConfigPath = "userdata\\%user%\\config\\shortcuts.vdf";

export class Steamer {
    public steamDirectory: string;
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
     * Check if steam is installed
     */
    private checkSteamInstallation() {
        // first we locate steam directory
        for (const loc of possibleSteamLocations) {
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

        this.log("Retrieving shortcut files for each user...");

        for (const user of userDirectories) {

        }

    }

    private generateShortcutFilesList() {
        return ["dd"];
    }
}
