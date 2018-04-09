declare const Promise: any;
import * as path from "path";
const { app, Menu, MenuItem, Tray } = require("electron");
import { SteamerHelpers } from "./SteamerHelpers";
const helper = new SteamerHelpers();

export class TrayManager {
    constructor() {
        let tray = null;
        const launchOnStartup: any = helper.getConfig("launchOnStartup");
        app.on("ready", () => {
            console.log(__dirname + "assets/steamer.png");
            tray = new Tray(path.join(__dirname, "assets/steamer.png"));
            const contextMenu = Menu.buildFromTemplate([
                {
                    label: "Launch On Startup",
                    type: "checkbox",
                    checked: launchOnStartup,
                    click() { helper.toggleLaunchOnStartup(); }
                },
                {
                    label: "Quit",
                    type: "normal",
                    click() { helper.quitApp(); }
                }
            ]);
            tray.setToolTip("This is my application.");
            tray.setContextMenu(contextMenu);
        });
    }
}
