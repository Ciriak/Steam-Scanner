import { } from "lodash";
import * as path from "path";
import * as shortcut from "steam-shortcut-editor";

import Config from "./Config";

export class SteamUser {
    public userId: string;
    public userDirectory: string = "";
    public shortcutsFilePath: string = "";
    private config: Config;
    constructor(userId: string, config: Config) {
        this.userId = userId;
        this.config = config;
        this.initUser();
    }

    // retrieve user files
    private initUser() {
        this.userDirectory = path.join(
            this.config.steamDirectory,
            "userdata",
            this.userId
        );
        this.shortcutsFilePath = path.join(
            this.userDirectory,
            "config",
            "shortcuts.vdf"
        );
    }
}