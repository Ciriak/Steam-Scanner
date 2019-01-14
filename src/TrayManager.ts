import * as path from "path";
const colors = require("colors");

const { Menu, Tray, dialog } = require("electron");
import { DRMManager } from "./DRMManager";
import { Scanner } from "./Scanner";
import { ScannerHelpers } from "./ScannerHelpers";
import { Config } from "./Config";
const config: Config = new Config();

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
    const launchOnStartup: any = config.get("launchOnStartup");
    const enableNotifications: any = config.get("enableNotifications");

    const scanTemplate = this.generateScanButton(scanner);
    const gamesListTemplate = this.generateGamesListTemplate(scanner);

    const contextMenu = [
      { label: this.scanner.versionLabel, type: "normal", enabled: false },
      { type: "separator" },
      scanTemplate,
      {
        label: "Display notifications",
        type: "checkbox",
        checked: enableNotifications,
        click() {
          config.updateNotifications();
        }
      },
      {
        label: "Launch on startup",
        type: "checkbox",
        checked: launchOnStartup,
        click() {
          config.updateLaunchOnStartup();
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
  private generateGamesListTemplate(scanner: Scanner) {
    let accessor = this;
    const gamesListTemplate: any = [];
    const drmManager = new DRMManager();
    let gamesCount = 0;

    const drmList = config.get("drm");
    for (const drmName in drmList) {
      if (drmList.hasOwnProperty(drmName)) {
        const drm = drmList[drmName];
        // aLl games of a drm
        for (const gameName in drm.games) {
          if (drm.games.hasOwnProperty(gameName)) {
            const game = drm.games[gameName];
            let gameMenuLabel,
              startPath,
              icon = path.join(__dirname, "assets", "unknown-game.png");

            if (game.binary) {
              gameMenuLabel = "Change the executable of ";
              startPath = game.binary;
            } else {
              gameMenuLabel = "Select the executable of ";
              startPath = game.directory;
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
                        drmManager.setBinaryForGame(
                          drmName,
                          gameName,
                          filePath[0],
                          true
                        );
                        scanner.updateShortcuts();
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
