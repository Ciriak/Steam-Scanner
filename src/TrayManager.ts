import * as path from "path";
const colors = require("colors");

const { Menu, Tray, dialog } = require("electron");
import { Config } from "./Config";
import { LaunchersManager } from "./LaunchersManager";
import { Scanner } from "./Scanner";
import { ScannerHelpers } from "./ScannerHelpers";

const helper = new ScannerHelpers();
export class TrayManager {
  private tray: any;
  private scanner: Scanner;

  constructor(scanner: Scanner) {
    this.scanner = scanner;
    this.tray = new Tray(path.join(__dirname, "assets/tray.png"));
    this.update(scanner);
  }

  /**
   * Refresh the tray icon and menu
   * @param scanner Scanner instance
   */
  public update(scanner: Scanner) {
    const launchOnStartup: any = this.scanner.config.launchOnStartup;
    const enableNotifications: any = this.scanner.config.enableNotifications;

    const scanTemplate = this.generateScanButton(scanner);
    const gamesListTemplate = this.generateGamesListTemplate();
    // todo remove that
    const trayRef = this;
    const contextMenu = [
      { label: this.scanner.versionLabel, type: "normal", enabled: false },
      { type: "separator" },
      scanTemplate,
      {
        label: "Display notifications",
        type: "checkbox",
        checked: enableNotifications,
        click() {
          this.config.updateNotifications();
        }
      },
      {
        label: "Launch on startup",
        type: "checkbox",
        checked: launchOnStartup,
        click() {
          trayRef.scanner.config.updateLaunchOnStartup();
        }
      },
      {
        label: "Quit",
        type: "normal",
        click() {
          helper.quitApp();
        }
      }
    ];

    // fuze the games list with the menu
    for (const game of gamesListTemplate) {
      contextMenu.splice(2, 0, game);
    }

    this.tray.setToolTip(this.scanner.versionLabel);
    this.tray.setContextMenu(Menu.buildFromTemplate(contextMenu));
  }

  /**
   * Generate the game menu list with their options depending of their status
   * @param scanner Scanner instance
   */
  private generateGamesListTemplate() {
    const accessor = this;
    const gamesListTemplate: any = [];
    const launchersManager = this.scanner.launchersManager;
    let gamesCount = 0;

    const launchersList = this.scanner.config.launchers;
    for (const launcherName in launchersList) {
      if (launchersList.hasOwnProperty(launcherName)) {
        const launcher = launchersList[launcherName];
        // aLl games of a drm
        for (const gameName in launcher.games) {
          if (launcher.games.hasOwnProperty(gameName)) {
            const game = launcher.games[gameName];
            let gameMenuLabel;
            let startPath;
            const icon = path.join(__dirname, "assets", "unknown-game.png");

            if (game.binaries && game.binaries[0]) {
              gameMenuLabel = "Change the executable of ";
              startPath = game.binaries[0];
            } else {
              gameMenuLabel = "Select the executable of ";
              startPath = game.folderPath;
            }
            gamesCount++;
            // if (game.icon && game.icon["16"]) {
            //   icon = game.icon["16"];
            // }
            gamesListTemplate.push({
              icon: icon,
              label: gameName,
              submenu: [
                {
                  label: gameMenuLabel + gameName,
                  click() {
                    // the user select a executable for the game
                    dialog.showOpenDialog(
                      {
                        title: gameMenuLabel + gameName,
                        defaultPath: startPath
                      },
                      function(filePath) {
                        if (!filePath || !filePath[0]) {
                          return;
                        }
                        launchersManager.setBinaryForGame(
                          launcherName,
                          gameName,
                          filePath[0],
                          true
                        );
                        accessor.scanner.updateShortcuts();
                        helper.log(
                          colors.cyan("Binary updated for " + gameName + " =>")
                        );
                        helper.log(filePath[0]);
                        accessor.update(accessor.scanner);
                      }
                    );
                  } /* <== lol */
                }
              ]
            });
          }
        }
      }
    }

    // add a separator if games were found
    if (gamesCount > 0) {
      gamesListTemplate.unshift({ type: "separator" });
    }

    return gamesListTemplate;
  }

  /**
   * @returns the proper scan button / label depending of the scanner status
   * @param scanner scanner instance
   */
  private generateScanButton(scanner: Scanner) {
    let scanTemplate;
    // generate the "scanning"
    if (scanner.isScanning === true) {
      scanTemplate = {
        label: "Scanning games ...",
        type: "normal",
        enabled: false
      };
    } else {
      scanTemplate = {
        label: "Scan games now",
        type: "normal",
        click() {
          scanner.scan();
        }
      };
    }
    return scanTemplate;
  }
}
