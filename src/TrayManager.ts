declare const Promise: any;
import * as path from "path";
const { app, Menu, MenuItem, Tray } = require("electron");

import { Scanner } from "./Scanner";
import { ScannerHelpers } from "./ScannerHelpers";

const helper = new ScannerHelpers();
export class TrayManager {
  private tray: any;
  private scanner: Scanner;
  constructor(scanner: Scanner) {
    this.scanner = scanner;
    this.tray = new Tray(path.join(__dirname, "assets/scanner.png"));
    this.update(scanner);
  }

  public update(scanner: Scanner) {
    const launchOnStartup: any = helper.getConfig("launchOnStartup");
    const enableNotifications: any = helper.getConfig("enableNotifications");

    let scanTemplate;
    if (scanner.isScanning) {
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

    const contextMenu = Menu.buildFromTemplate([
      {
        label: this.scanner.versionLabel,
        type: "normal",
        enabled: false
      },
      {
        type: "separator"
      },
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
    ]);

    this.tray.setToolTip(this.scanner.versionLabel);
    this.tray.setContextMenu(contextMenu);
  }
}
