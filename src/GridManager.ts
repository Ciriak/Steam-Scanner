import { app, BrowserWindow, ipcMain, shell, dialog } from "electron";
import path from "path";
import { logError, logWarn, log } from "./utils/helper.utils";
import Config from "./Config";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import colors from "colors";
import SteamScanner from "./app";
import { existsSync, copyFile } from "fs-extra";

export enum GridManagerEvents {
    GET_CONFIG = "GRID_GET_CONFIG",
    SET_CONFIG = "GRID_SET_CONFIG",
    GET_STATE_ACTIVE = "GRID_GET_STATE_ACTIVE",
    EVENT_STATE_ACTIVE = "GRID_EVENT_STATE_ACTIVE",
    RUN_STEAM_GRID = "GRID_RUN_STEAM_GRID",
    STOP_STEAM_GRID = "GRID_STOP_STEAM_GRID",
    RESET_STEAM_GRID = "GRID_RESET_STEAM_GRID",
}

const processTimeoutDelay = (60 * 1000) * 2; // 2min


export default class GridManager {
    public active: boolean = false;
    private config: Config;
    private scanner: SteamScanner;
    private shouldRerun: boolean = false;
    private browserWindow?: BrowserWindow;
    private steamGridProcess?: ChildProcessWithoutNullStreams;
    private processTimeout?: NodeJS.Timeout;
    private gridOriginalExe = path.join(app.getAppPath(), "native", "steamgrid.exe");
    private gridExe = path.join(app.getPath("appData"), "steam-scanner", "steamgrid.exe");
    constructor(scanner: SteamScanner) {
        this.scanner = scanner;
        this.config = scanner.config;
        this.initIPCListeners();
        this.ensureSteamGridExe();
    }

    /**
     * Stop the SteamGrid process
     */
    stopGrid(restart?: boolean) {
        if (this.steamGridProcess) {
            if (this.shouldRerun) {
                this.shouldRerun = false;
            }

            if (restart) {
                this.shouldRerun = true;
            }
            this.steamGridProcess.kill('SIGINT');
        }
    }

    /**
     * Use SteamGrid to retrieve the cover images
     */
    getGrid() {

        if (this.active) {
            logWarn("A Steam Grid process is currently in progress, restarting...");
            this.stopGrid(true);
            return;
        }

        log(colors.magenta("Starting Steam Grid Process..."))

        let args: string[] = ['--nonsteamonly'];

        // set the steamGridDb token if available in the config
        if (this.config.steamGridDbToken) {
            log(colors.magenta("SteamGridDb token has been provided and will be used to retrieve the Steam Grid Items"));
            args = args.concat(["--steamgriddb", this.config.steamGridDbToken])
        }

        // set the steamGridDb token if available in the config
        if (this.config.animatedCover) {
            log(colors.magenta("SteamGrid will use animated covers image when possible"));
            args = args.concat(["--types", 'animated'])
        }

        this.setActiveState(true);
        ipcMain.emit(GridManagerEvents.EVENT_STATE_ACTIVE, true);

        log(`Starting SteamGrid\nCommand : ${this.gridExe} ${args.join(" ")}`);

        this.steamGridProcess = spawn(this.gridExe, args, {
            windowsHide: true
        });

        this.steamGridProcess.stdout.on('data', (data) => {
            log(`${colors.magenta("[Steam Grid]")} > ${String(data)}`)
        });

        this.steamGridProcess.stderr.on('data', (data) => {
            logError(`${colors.magenta("[Steam Grid]")} > ${String(data)}`);
        });

        // clear the timeout
        if (this.processTimeout) {
            clearTimeout(this.processTimeout);
        }

        // set the timeout
        this.processTimeout = setTimeout(() => {
            this.stopGrid();
        }, processTimeoutDelay)

        this.steamGridProcess.on('close', () => {
            log("Steam grid process stopped");
            this.setActiveState(false);
            ipcMain.emit(GridManagerEvents.EVENT_STATE_ACTIVE, false);

            // rerun if needed
            if (this.shouldRerun) {
                this.getGrid();
            }
        })
    }

    private setActiveState(state: boolean) {
        this.active = state;
        // emit the update event
        ipcMain.emit(GridManagerEvents.EVENT_STATE_ACTIVE, state);
        // refresh the tray
        this.scanner.trayManager.setTray();
    }

    /**
     * Create the browserwindow for the steam grid settings
     */
    openSettings() {


        // open if the instance already exists
        if (this.browserWindow) {
            this.browserWindow.show();
            return;
        }

        // create a new browser window instance
        this.browserWindow = new BrowserWindow({
            autoHideMenuBar: true,
            show: true,
            hasShadow: false,
            maximizable: false,
            minWidth: 800,
            minHeight: 450,
            darkTheme: true,
            webPreferences: {
                nodeIntegration: true
            }
        });
        // this.browserWindow.webContents.openDevTools({
        //     mode: "detach"
        // });
        this.browserWindow.loadURL(path.join(app.getAppPath(), "grid.html"));

        // Open links in browser window
        this.browserWindow?.webContents.on('new-window', (e: any, url) => {
            e.preventDefault();
            shell.openExternal(url);
        });

        // hide browser window instead of closing it
        this.browserWindow?.on("close", () => {
            delete this.browserWindow;
        });
    }

    private initIPCListeners() {
        ipcMain.on(GridManagerEvents.GET_CONFIG, (e) => {
            const val: any = {
                apiUrl: this.config.apiUrl,
                steamGridDbToken: this.config.steamGridDbToken,
                enableGrid: this.config.enableGrid,
                animatedCover: this.config.animatedCover
            }
            e.returnValue = val;
        });

        ipcMain.on(GridManagerEvents.SET_CONFIG, (e, newConfig: any) => {
            /**
             * Save the received props into the config
             */
            for (const newProp in newConfig) {
                if (newConfig.hasOwnProperty(newProp)) {
                    const newValue = newConfig[newProp];
                    this.config[newProp] = newValue;
                }
            }

            log("Config updated from the grid settings view");
            log(newConfig);
        });

        ipcMain.on(GridManagerEvents.RUN_STEAM_GRID, () => {
            log(colors.cyan(GridManagerEvents.RUN_STEAM_GRID + " request received"));
            this.getGrid();
        });

        ipcMain.on(GridManagerEvents.STOP_STEAM_GRID, () => {
            log(colors.cyan(GridManagerEvents.STOP_STEAM_GRID + " request received"));
            this.stopGrid();
        });

        ipcMain.on(GridManagerEvents.GET_STATE_ACTIVE, (e) => {
            e.returnValue = this.active;
        });

        /**
         * Grid reset
         */
        ipcMain.on(GridManagerEvents.RESET_STEAM_GRID, (e) => {
            dialog.showMessageBox({
                title: "Reset Steam Grid",
                type: "question",
                message: "Are you sure you want to reset the Steam Grid ?\nThis will also restart the Steam client",
                buttons: ["Yes", "No"],
            }).then((response) => {
                // if user said yes
                if (response.response === 0) {
                    this.resetGrid();
                }
            });
        });
    }

    /**
     * Clear all items in the grid folder
     */
    private async resetGrid() {
        log(colors.magenta("Resetting the Steam grids..."));
        this.scanner.steam.restartSteam();
        for (const steamUser of this.scanner.steam.steamUsers) {
            await steamUser.cleanGrid();
        }
        log(colors.magenta("Steam grids cleaned"));
    }

    /**
     * Ensure that the SteamGrid executablme is available to the OS
     *
     * This is due to the fact that Electron is unable to spawn a process that is stored in an asar archive
     *
     * So we copy the exe outside before
     */
    private ensureSteamGridExe() {
        if (!existsSync(this.gridExe)) {
            log("SteamGrid.exe not available ... copying...");
            copyFile(this.gridOriginalExe, this.gridExe).then(() => {
                log(colors.green("SteamGrid.exe copied to the appData directory !"));
            });
        }
    }
}