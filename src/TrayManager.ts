import { app, Menu, Tray, MenuItem } from "electron";
import trayIconData from "./assets/scanner.ico";
import defaultGameIconData from "./assets/unknown-game.png";
const trayIcon = trayIconData;
const defaultGameIcon = defaultGameIconData;
import path from "path"
import SteamScanner from "./app";
import Config from "./Config";
export default class Traymanager {
    tray?: Tray;
    scanner: SteamScanner;
    config: Config;
    constructor(scanner: SteamScanner) {
        this.scanner = scanner;
        this.config = scanner.config;
        app.on("ready", () => {
            this.setTray();
        });

    }

    public setTray() {
        this.tray = new Tray(path.join(app.getAppPath(), trayIcon));
        const header = new MenuItem({
            label: "Steam Scanner v0.1",
            enabled: false,
        });
        const separator = new MenuItem({
            type: "separator"
        });


        const gameMenu = Menu.buildFromTemplate([
            {
                label: "toto.exe",
                icon: path.join(app.getAppPath(), defaultGameIcon)
            }
        ])

        const launchers: MenuItem[] = this.generateLaunchersList();

        const contextMenu = Menu.buildFromTemplate([
            header,
            separator
        ].concat(launchers));

        this.tray.setContextMenu(contextMenu)
    }

    private generateLaunchersList(): MenuItem[] {
        const menuItems: MenuItem[] = [];
        for (const launcherName in this.config.launchers) {
            if (this.config.launchers.hasOwnProperty(launcherName)) {
                const launcher = this.config.launchers[launcherName];
                const launcherMenuItems: MenuItem[] = [
                    new MenuItem({
                        label: launcherName,
                        icon: path.join(app.getAppPath(), defaultGameIcon)
                    })
                ];

                for (const gameName in launcher.games) {
                    if (launcher.games.hasOwnProperty(gameName)) {
                        let gameMenu: MenuItem;
                        const game = launcher.games[gameName];
                        if (game.binarySet) {
                            gameMenu = new MenuItem({
                                label: gameName,
                                icon: path.join(app.getAppPath(), defaultGameIcon)
                            })
                        }
                        else {
                            gameMenu = new MenuItem({
                                label: gameName,
                                icon: path.join(app.getAppPath(), defaultGameIcon)
                            })
                        }

                        launcherMenuItems.push(gameMenu);
                    }

                }
                menuItems.concat(launcherMenuItems);

            }

        }


        // [
        //     new MenuItem({

        //         label: "Apex Legends",
        //         sublabel: "Select the correct executable",
        //         icon: path.join(app.getAppPath(), defaultGameIcon)
        //         , submenu: gameMenu
        //     }),
        // ]
        return menuItems;
    }
}