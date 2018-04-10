declare const Promise: any;
import * as path from "path";
const { app, Menu, MenuItem, Tray } = require("electron");
import { SteamerHelpers } from "./SteamerHelpers";
const helper = new SteamerHelpers();

export class TrayManager {
  constructor() {
    let tray = null;
    const launchOnStartup: any = helper.getConfig("launchOnStartup");
    const enableNotifications: any = helper.getConfig("enableNotifications");
    app.on("ready", () => {
      console.log(__dirname + "assets/steamer.png");
      tray = new Tray(path.join(__dirname, "assets/steamer.png"));
      let versionLabel = "Steamer V." + app.getVersion();
      if (helper.isDev) {
        versionLabel = versionLabel + " (Dev build)";
      }
      const contextMenu = Menu.buildFromTemplate([
        {
          label: versionLabel,
          type: "normal",
          enabled: false
        },
        {
          type: "separator"
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
      tray.setToolTip("This is my application.");
      tray.setContextMenu(contextMenu);
    });
  }
}
