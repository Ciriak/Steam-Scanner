import Traymanager from "./TrayManager";
import Config from "./Config";
import Steam from "./Steam";
import { LaunchersManager } from "./LaunchersManager";
import NotificationsManager from "./Notification";

const autoScanInterval = 5 * 60 * 1000;

export default class SteamScanner {
    trayManager: Traymanager;
    config: Config;
    steam: Steam;
    launchersManager: LaunchersManager;
    notificationsManager: NotificationsManager;
    constructor() {
        this.config = new Config(this);
        this.steam = new Steam(this);
        this.launchersManager = new LaunchersManager(this);
        this.trayManager = new Traymanager(this);
        this.notificationsManager = new NotificationsManager(this);
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
}

// tslint:disable-next-line: no-unused-expression
new SteamScanner();