import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { rmdirSync, existsSync, createWriteStream } from "fs-extra";
import { logError, logWarn, log } from "./utils/helper.utils";
import IGame from "./interfaces/Game.interface";
import axios from "axios";
import Config from "./Config";
import { execFile } from "child_process";
import colors from "colors";
import SteamScanner from "./app";
import IConfig from "./interfaces/Config.interface";

export enum GridManagerEvents {
    GET_CONFIG = "GRID_GET_CONFIG",
    SET_CONFIG = "GRID_SET_CONFIG"
}


export default class GridManager {
    baseCoverPath: string = path.join(app.getPath("appData"), "steam-scanner", "cachedcovers");
    private config: Config;
    private active: boolean = false;
    private shouldRerun: boolean = false;
    private browserWindow?: BrowserWindow;
    private steamGridProcess: any;
    constructor(scanner: SteamScanner) {
        this.config = scanner.config;
        app.on('ready', () => {
            this.browserWindow = new BrowserWindow({
                autoHideMenuBar: true,
                show: false,
                hasShadow: false,
                maximizable: false,
                minWidth: 800,
                minHeight: 450,
                webPreferences: {
                    nodeIntegration: true
                }
            });
            this.browserWindow.webContents.openDevTools({
                mode: "detach"
            });
            this.browserWindow.loadURL(path.join(app.getAppPath(), "grid.html"));

            // Open links in browser window
            this.browserWindow?.webContents.on('new-window', (e: any, url) => {
                e.preventDefault();
                shell.openExternal(url);
            });

            // hide browser window instead of closing it
            this.browserWindow?.on("close", (e: any) => {
                e.preventDefault();
                this.browserWindow?.hide();
            });

        });



        this.initIPCListeners();
    }

    /**
     * Use SteamGrid to retrieve the cover images
     */
    getGrid() {

        if (!this.config.enableGrid) {
            logWarn("Steam Grid is disabled : cover images won't be retrieved");
            return;
        }

        if (this.active) {
            logWarn("A Steam Grid process is currently in progress, it will be rerun on end");
            this.shouldRerun = true;
            return;
        }

        if (this.shouldRerun) {
            this.shouldRerun = false;
        }

        log(colors.magenta("Starting Steam Grid Process..."))
        const gridExe = path.join(app.getAppPath(), "native", "steamgrid.exe");

        let args: string[] = [];

        // set the steamGridDb token if available in the config
        if (this.config.steamGridDbToken) {
            log(colors.magenta("SteamGridDb token has been provided and will be used to retrieve the Steam Grid Items"));
            args = args.concat(["--steamgriddb", this.config.steamGridDbToken])
        }

        // set the steamGridDb token if available in the config
        if (this.config.animatedCover) {
            log(colors.magenta("SteamGrid will use animated covers image when possible"));
            args = args.concat(["--types", 'animated,static'])
        }

        this.steamGridProcess = execFile(gridExe, args, {
            windowsHide: true
        });

        this.steamGridProcess.on('close', () => {
            this.active = false;

            // rerun if needed
            if (this.shouldRerun) {
                this.getGrid();
            }
        })
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
        })
    }
}