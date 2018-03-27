import * as fs from "fs-extra";
import * as path from "path";

export class SteamUser {
    public directory: string;
    public shortcutsFilePath: string;
    constructor(userDirectory: string) {
        this.directory = userDirectory;
        this.initUser();
    }

    // retrieve user files
    private initUser() {
    }
}
