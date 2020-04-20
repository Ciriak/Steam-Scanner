import Traymanager from "./TrayManager";
import Config from "./Config";
import Steam from "./Steam";
import { app } from "electron";
import { LaunchersManager } from "./LaunchersManager";
import NotificationsManager from "./Notification";
import Updater from "./Updater";
import { logError } from "./utils/helper.utils";

const autoScanInterval = 5 * 60 * 1000;

export default class SteamScanner {
    trayManager: Traymanager;
    config: Config;
    steam: Steam;
    launchersManager: LaunchersManager;
    notificationsManager: NotificationsManager;
    updater: Updater;
    constructor() {
        this.config = new Config(this);
        this.steam = new Steam(this);
        this.launchersManager = new LaunchersManager(this);
        this.trayManager = new Traymanager(this);
        this.notificationsManager = new NotificationsManager(this);
        this.updater = new Updater(this);
        this.handleSingleInstance();
        this.scan();
        setTimeout(() => {
            this.scan();
        }, autoScanInterval)
    }


    public async scan() {
        await this.steam.checkInstallation();
        await this.launchersManager.detectAllLaunchers();
        await this.launchersManager.getAllGames().then(() => {
            this.trayManager.setTray();
        })
    };

    /**
     * Check if another instance is running
     *
     * if so, quit
     */
    private handleSingleInstance() {
        const lock = app.requestSingleInstanceLock();
        // another instance is running => quit
        if (!lock) {
            logError("Another active instance of steam scanner has been detected, quitting...");
            app.quit();
        }


    }
}

// tslint:disable-next-line: no-unused-expression
new SteamScanner();