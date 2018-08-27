declare const Promise: any;
import * as path from "path";
const colors = require("colors");

const { Menu, Tray, dialog } = require("electron");
import { DRMManager } from "./DRMManager";
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

  public update(scanner: Scanner) {
    const launchOnStartup: any = helper.getConfig("launchOnStartup");
    const enableNotifications: any = helper.getConfig("enableNotifications");

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
          helper.updateNotifications();
        }
      },
      {
        label: "Launch on startup",
        type: "checkbox",
        checked: launchOnStartup,
        click() {
          helper.updateLaunchOnStartup();
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

  private generateGamesListTemplate(scanner: Scanner) {
    const gamesListTemplate: any = [];
    const drmManager = new DRMManager();
    let gamesCount = 0;

    const drmList = helper.getConfig("drm");
    for (const drmName in drmList) {
      if (drmList.hasOwnProperty(drmName)) {
        const drm = drmList[drmName];
        // aLl games of a drm
        for (const gameName in drm.games) {
          if (drm.games.hasOwnProperty(gameName)) {
            const game = drm.games[gameName];
            let gameMenuLabel, startPath;

            if (game.binary) {
              gameMenuLabel = "Change the executable of ";
              startPath = game.binary;
            } else {
              gameMenuLabel = "Select the executable of ";
              startPath = game.directory;
            }
            gamesCount++;
            gamesListTemplate.push({
              icon: game.icon,
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
                      }
                    );
                  }
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
