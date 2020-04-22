import Traymanager from "./TrayManager";
import Config from "./Config";
import Steam from "./Steam";
import { app } from "electron";
import { LaunchersManager } from "./LaunchersManager";
import NotificationsManager from "./Notification";
import Updater from "./Updater";
import { logError, log, logWarn } from "./utils/helper.utils";
import isDev from "electron-is-dev";

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
        this.handleAutoLaunch();
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

    /**
     * If this is a packed app, set it to launch on system start
     */
    private async handleAutoLaunch() {
        log("Checking auto-launch...");

        // stop if dev mode
        if (isDev) {
            logWarn("Auto-launch check ignored since we are in dev mode");
            return;
        }

        app.setLoginItemSettings({
            openAtLogin: true
        });

        log("Auto launch ready and set !");
    }
}

// tslint:disable-next-line: no-unused-expression
new SteamScanner();