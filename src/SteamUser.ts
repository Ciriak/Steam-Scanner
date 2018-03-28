import * as fs from "fs-extra";
import * as path from "path";
import { Steamer } from "./Steamer";

export class SteamUser {
    public userId: any;
    public directory: string;
    public shortcutsFilePath: string;
    private steamerInstance: Steamer;
    constructor(userId: string, steamer: Steamer) {
        this.userId = userId;
        this.steamerInstance = steamer;
        this.initUser();
    }

    // retrieve user files
    private initUser() {
        this.directory = path.join(this.steamerInstance.steamDirectory, "userdata", this.userId);
        this.shortcutsFilePath = path.join(this.directory, "config", "shortcuts.vdf");
    }
}
