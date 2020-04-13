import Traymanager from "./TrayManager";
import Config from "./Config";
import Steam from "./Steam";
export default class SteamScanner {
    trayManager: Traymanager;
    config: Config;
    steam: Steam;
    constructor() {
        this.config = new Config();
        this.steam = new Steam(this.config);
        this.trayManager = new Traymanager();
        this.init();
    }


    private async init() {

    }
}

// tslint:disable-next-line: no-unused-expression
new SteamScanner();