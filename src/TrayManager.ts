import { app, Menu, Tray, MenuItem } from "electron";
import trayIconData from "./assets/scanner.ico";
import defaultGameIconData from "./assets/tray/unknown-game.png";
import defaultExeIcon from "./assets/tray/exe.png";
import ignoreGameIcon from "./assets/tray/ignore.png"
import resetIcon from "./assets/tray/reset.png";

const trayIcon = trayIconData;
const defaultGameIcon = defaultGameIconData;
import path from "path"
import SteamScanner from "./app";
import Config from "./Config";
import ILauncher from "./interfaces/Launcher.interface";
import launchers from "./library/LaunchersList";
export default class Traymanager {
    tray?: Tray;
    scanner: SteamScanner;
    config: Config;
    gameNeedExeSelectList: IGame[] = [];
    constructor(scanner: SteamScanner) {
        this.scanner = scanner;
        this.config = scanner.config;
        app.on("ready", () => {
            this.tray = new Tray(path.join(app.getAppPath(), trayIcon));
            this.setTray();
        });

    }

    /**
     * Refresh the tray instance with updated data
     */
    public setTray() {


        // stop if the tray is not ready yet
        if (!this.tray) {
            return;
        }

        const header = new MenuItem({
            label: "Steam Scanner v0.1",
            enabled: false,
        });
        const separator = new MenuItem({
            type: "separator"
        });

        const launchersMenuItems: MenuItem[] = this.generateLaunchersList();


        const contextMenu = Menu.buildFromTemplate([
            header,
            separator
        ].concat(launchersMenuItems));

        this.tray.setContextMenu(contextMenu);

        // show a notification if some game need an exe selection

        // only one game
        if (this.gameNeedExeSelectList.length === 1) {
            this.scanner.notificationsManager.notification({
                title: "Manual exe selection needed",
                message: `We found various possible executables for ${this.gameNeedExeSelectList[0].name}, click on this notification to select the correct one`,
                shouldOpenMenu: true
            })
        }
        // more than one game
        if (this.gameNeedExeSelectList.length > 1) {
            this.scanner.notificationsManager.notification({
                title: "Manual exe selection needed",
                message: `We found various possible executables for ${this.gameNeedExeSelectList.length} games, click on this notification to select the correct one`,
                shouldOpenMenu: true
            })
        }

    }

    private generateLaunchersList(): MenuItem[] {
        this.gameNeedExeSelectList = [];    // reset the count
        let menuItems: MenuItem[] = [];
        for (const launcherName in this.config.launchers) {
            if (this.config.launchers.hasOwnProperty(launcherName)) {
                const launcher = this.config.launchers[launcherName];
                const launcherMenuItems = this.generateGamesListForLauncher(launcher);
                menuItems = menuItems.concat(launcherMenuItems);
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

    private generateGamesListForLauncher(launcher: ILauncher): MenuItem[] {
        const menu: MenuItem[] = [
            new MenuItem({
                label: launcher.name,
                icon: path.join(app.getAppPath(), launchers[launcher.name].icon),
                enabled: false
            }),
            new MenuItem({
                type: "separator"
            })
        ];

        const gamesMenu: MenuItem[] = [];

        for (const gameName in launcher.games) {
            if (launcher.games.hasOwnProperty(gameName)) {
                let gameMenu: MenuItem;
                const game = launcher.games[gameName];
                if (game.hidden) {  // ignore hidden game
                    continue;
                }
                // if the game is already known and ready to use
                if (game.binarySet) {
                    gameMenu = new MenuItem({
                        label: gameName,
                        icon: path.join(app.getAppPath(), defaultGameIcon),
                        sublabel: "In your Steam library",
                        submenu: this.generateGameOptionsMenu(game)
                    })
                }
                // if we don't know the game exe yet
                else {
                    this.gameNeedExeSelectList.push(game);  // increment the game exe needed count
                    gameMenu = new MenuItem({
                        label: gameName,
                        icon: path.join(app.getAppPath(), defaultGameIcon),
                        sublabel: "Select the game .exe",
                        submenu: this.generateGameExeList(game)
                    })
                }

                gamesMenu.push(gameMenu);
            }

        }

        // add a label if no game found for this launcher
        if (gamesMenu.length === 0) {
            gamesMenu.push(new MenuItem({
                label: "No game found",
                enabled: false,
                role: "about"
            }))
        }

        // add the final separator
        gamesMenu.push(new MenuItem({
            type: "separator"
        }));


        return menu.concat(gamesMenu);
    }

    private generateGameExeList(game: IGame): Menu {

        const menuItems: MenuItem[] = [
            new MenuItem({
                icon: path.join(app.getAppPath(), ignoreGameIcon),
                label: "Ignore this game",
                click: () => {
                    this.scanner.launchersManager.ignoreGame(game)
                }
            }),
            new MenuItem({
                type: "separator"
            })
        ];
        for (const binary of game.binaries) {

            menuItems.push(new MenuItem({
                label: path.basename(binary),
                icon: path.join(app.getAppPath(), defaultExeIcon),
                click: () => {
                    game.binaries = [binary];
                    this.scanner.launchersManager.setBinaryForGame(game, true)
                }
            }));
        }

        return Menu.buildFromTemplate(menuItems);

    }

    private generateGameOptionsMenu(game: IGame): Menu {
        const menuItems: MenuItem[] = [
            new MenuItem({
                icon: path.join(app.getAppPath(), resetIcon),
                label: "Reset the game infos",
                click: () => {
                    this.scanner.launchersManager.resetGame(game);
                }
            })
        ];
        return Menu.buildFromTemplate(menuItems);
    }
}