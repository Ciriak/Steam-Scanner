import { app, Menu, Tray, MenuItem } from "electron";
import trayIconData from "./assets/tray/tray.png";
import defaultGameIconData from "./assets/tray/unknown-game.png";
import ignoreGameIcon from "./assets/tray/ignore.png"
import resetIcon from "./assets/tray/reset.png";
import scanIcon from "./assets/tray/reset.png";
import gridIcon from "./assets/tray/grid.png";
import quitIcon from "./assets/tray/quit.png";
import deleteIcon from "./assets/tray/delete.png";

const trayIcon = trayIconData;
const defaultGameIcon = defaultGameIconData;
import path from "path"
import SteamScanner from "./app";
import Config from "./Config";
import ILauncher from "./interfaces/Launcher.interface";
import IGame from "./interfaces/Game.interface";
export default class Traymanager {
    tray?: Tray;
    scanner: SteamScanner;
    config: Config;
    gameNeedExeSelectList: IGame[] = [];
    private alreadySet: boolean = false;
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
            label: "Steam Scanner v" + this.config.version,
            enabled: false,
        });
        const separator = new MenuItem({
            type: "separator"
        });

        const notificationsOption = new MenuItem({
            type: "checkbox",
            label: "Display notifications",
            checked: this.config.enableNotifications,
            click: () => {
                this.config.enableNotifications = !this.config.enableNotifications
            }
        });

        const restartSteamOption = new MenuItem({
            type: "checkbox",
            label: "Restart Steam on change",
            checked: this.config.autoRestartSteam,
            click: () => {
                this.config.autoRestartSteam = !this.config.autoRestartSteam
            }
        });

        const scanButton = new MenuItem({
            label: "Scan games",
            icon: path.join(app.getAppPath(), scanIcon),
            click: () => {
                this.scanner.scan();
            }
        });

        let gridButtonLabel = "Steam Grid settings";
        if (this.scanner.gridManager.active) {
            gridButtonLabel += " [Running]"
        }

        const gridButton = new MenuItem({
            label: gridButtonLabel,
            icon: path.join(app.getAppPath(), gridIcon),
            click: () => {
                this.scanner.gridManager.openSettings();
            }
        });

        const quitButton = new MenuItem({
            label: "Quit",
            icon: path.join(app.getAppPath(), quitIcon),
            click: () => {
                app.quit();
            }
        });

        const launchersMenuItems: MenuItem[] = this.generateLaunchersList();


        const contextMenu = Menu.buildFromTemplate([
            header,
            separator,
            scanButton,
            gridButton,
            notificationsOption,
            restartSteamOption,
            separator
        ].concat(launchersMenuItems));

        // quit button
        contextMenu.append(separator);
        contextMenu.append(quitButton);


        this.tray.setContextMenu(contextMenu);


        // title and tooltip
        this.tray.setTitle("Steam Scanner");
        this.tray.setToolTip("Steam Scanner");
        // show a notification if some game need an exe selection

        // show context menu even on normal click
        if (!this.alreadySet) {
            this.tray.on("click", () => {
                this.tray?.popUpContextMenu();
            })
        }

        this.alreadySet = true;

    }

    private generateLaunchersList(): MenuItem[] {
        this.gameNeedExeSelectList = [];    // reset the count
        let menuItems: MenuItem[] = [];
        for (const launcherName in this.config.launchers) {
            if (this.config.launchers.hasOwnProperty(launcherName)) {
                const launcher = this.config.launchers[launcherName];
                const launcherMenuItems = this.generateGamesListForLauncher(launcher);
                if (launcherMenuItems) {
                    menuItems = menuItems.concat(launcherMenuItems);
                }
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

    private generateGamesListForLauncher(launcher: ILauncher): MenuItem[] | undefined {
        if (!this.scanner.config.launchers[launcher.name]) {
            return;
        }
        const menu: MenuItem[] = [
            new MenuItem({
                label: launcher.label,
                icon: path.join(app.getAppPath(), this.scanner.config.launchers[launcher.name].icon),
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
                // ignore hidden game
                if (game.hidden) {
                    continue;
                }

                // ignore if no binary to show
                if (game.binaries.length === 0) {
                    continue;
                }

                // if the game is already known and ready to use
                if (game.binarySet) {
                    const gameIcon = this.scanner.IconsUtil.getIcon(game.binaries[0]);
                    gameMenu = new MenuItem({
                        label: game.label,
                        icon: gameIcon[32],
                        submenu: this.generateGameOptionsMenu(game)
                    })
                }
                // if we don't know the game exe yet
                else {
                    // only add if the game was supposed to display a notification
                    if (!game.hideNotifications) {
                        this.gameNeedExeSelectList.push(game);  // increment the game exe needed count
                    }
                    gameMenu = new MenuItem({
                        label: game.label,
                        icon: path.join(app.getAppPath(), defaultGameIcon),
                        sublabel: "Select the game .exe",
                        submenu: this.generateGameExeList(game)
                    })
                }

                gamesMenu.push(gameMenu);
            }

        }

        // Hide the launcher if no game found
        if (gamesMenu.length === 0) {
            return;
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

            const icon = this.scanner.IconsUtil.getIcon(binary);

            menuItems.push(new MenuItem({
                label: path.basename(binary),
                icon: icon[16],
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
                type: "checkbox",
                enabled: false,
                checked: true,
                label: "In your Steam library",

            }),
            new MenuItem({
                type: "separator"
            }),
            new MenuItem({
                icon: path.join(app.getAppPath(), deleteIcon),
                label: "Delete from the Steam library",
                click: () => {
                    this.scanner.launchersManager.resetGame(game);
                }
            })
        ];
        return Menu.buildFromTemplate(menuItems);
    }
}