declare const Promise: any;
import * as path from "path";
const { app, Menu, MenuItem, Tray } = require("electron");

import { Scanner } from "./Scanner";
import { ScannerHelpers } from "./ScannerHelpers";

const helper = new ScannerHelpers();
let tray = null;
export class TrayManager {
  constructor(scanner: Scanner) {
    const launchOnStartup: any = helper.getConfig("launchOnStartup");
    const enableNotifications: any = helper.getConfig("enableNotifications");
    tray = new Tray(path.join(__dirname, "assets/scanner.ico"));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: scanner.versionLabel,
        type: "normal",
        enabled: false
      },
      {
        type: "separator"
      },
      {
        label: "Scan games now",
        type: "normal",
        click() {
          scanner.scan();
        }
      },
      {
        label: "Notifications",
        type: "checkbox",
        checked: enableNotifications,
        click() {
          helper.toggleNotifications();
        }
      },
      {
        label: "Launch On Startup",
        type: "checkbox",
        checked: launchOnStartup,
        click() {
          helper.toggleLaunchOnStartup();
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
    tray.setToolTip(scanner.versionLabel);
    tray.setContextMenu(contextMenu);
  }
}
