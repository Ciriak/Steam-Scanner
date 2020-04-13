import Traymanager from "./TrayManager";
import Config from "./Config";
import Steam from "./Steam";
import { LaunchersManager } from "./LaunchersManager";
export default class SteamScanner {
    trayManager: Traymanager;
    config: Config;
    steam: Steam;
    launchersManager: LaunchersManager;
    constructor() {
        this.config = new Config();
        this.steam = new Steam(this);
        this.launchersManager = new LaunchersManager(this);
        this.trayManager = new Traymanager();
        this.init();
    }


    private async init() {

    }
}

// tslint:disable-next-line: no-unused-expression
new SteamScanner();