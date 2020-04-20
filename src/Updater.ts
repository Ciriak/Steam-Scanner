
import { autoUpdater } from "electron-updater";
import Config from "./Config";
import SteamScanner from "./app";
import { logError, log } from "./utils/helper.utils";
import { IUpdaterState } from "./interfaces/Updater.interface";
import ElectronLog from "electron-log";

export default class Updater {
    private scanner: SteamScanner;
    state: IUpdaterState = {
        progress: 0,
        status: "noUpdate"
    };
    constructor(scanner: SteamScanner) {
        this.scanner = scanner;
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = true;
        autoUpdater.logger = ElectronLog;
        this.registerEvents();
        this.checkForUpdates();
    }

    /**
     * Check for updates
     */
    public checkForUpdates() {
        try {
            autoUpdater.checkForUpdatesAndNotify();
        } catch (error) {
            logError(error.message);
        }

    }

    /**
     * Quit the process and install the update
     */
    public installUpdate() {
        autoUpdater.quitAndInstall();
    }

    private registerEvents() {
        autoUpdater.on("checking-for-update", () => {
            this.setState({
                status: "checking"
            });

            log("Checking for update...");

        });

        autoUpdater.on("update-available", (info) => {
            this.setState({
                status: "updateAvailable"
            });

            log("Update available");
            log(info);
        });

        autoUpdater.on("update-not-available", (info) => {
            this.setState({
                status: "noUpdate"
            });

            log("No update available");
            log(info);
        });

        autoUpdater.on("error", (err) => {
            this.setState({
                status: "noUpdate"
            });

            logError("Error while checking for updates");
            logError(err.message);
        });

        autoUpdater.on("download-progress", (progressObj) => {
            this.setState({
                status: "updateAvailable",
                progress: progressObj.percent,
            });

            log(`Downloading update ... (${this.state.progress}%)`);

        });

        autoUpdater.on("update-downloaded", (info) => {
            this.setState({
                status: "ready"
            });

            log("Update downloaded and ready to be installed !");
            log(info);
            // auto install update
            this.installUpdate();
        });
    }

    /**
     * Set the state and send a socket update
     * @param state state properties to update
     */
    private setState(state: {
        [key: string]: any
    }) {
        for (const prop in state) {
            if (this.state.hasOwnProperty(prop) && state.hasOwnProperty(prop)) {
                this.state[prop] = state[prop];
            }
        }
    }
}
