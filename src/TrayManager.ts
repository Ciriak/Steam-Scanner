declare const Promise: any;
import * as path from "path";
const { app, Menu, MenuItem, Tray } = require("electron");

import { Steamer } from "./Steamer";
import { SteamerHelpers } from "./SteamerHelpers";

const helper = new SteamerHelpers();

export class TrayManager {
  constructor(steamer: Steamer) {
    let tray = null;
    const launchOnStartup: any = helper.getConfig("launchOnStartup");
    const enableNotifications: any = helper.getConfig("enableNotifications");
    tray = new Tray(path.join(__dirname, "assets/steamer.png"));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: steamer.versionLabel,
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
          steamer.scan();
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
    tray.setToolTip(steamer.versionLabel);
    tray.setContextMenu(contextMenu);
  }
}
