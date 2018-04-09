"use strict";
exports.__esModule = true;
var path = require("path");
var _a = require("electron"), app = _a.app, Menu = _a.Menu, MenuItem = _a.MenuItem, Tray = _a.Tray;
var SteamerHelpers_1 = require("./SteamerHelpers");
var helper = new SteamerHelpers_1.SteamerHelpers();
var TrayManager = /** @class */ (function () {
    function TrayManager() {
        var tray = null;
        var launchOnStartup = helper.getConfig("launchOnStartup");
        app.on("ready", function () {
            console.log(__dirname + "assets/steamer.png");
            tray = new Tray(path.join(__dirname, "assets/steamer.png"));
            var contextMenu = Menu.buildFromTemplate([
                {
                    label: "Launch On Startup",
                    type: "checkbox",
                    checked: launchOnStartup,
                    click: function () { helper.toggleLaunchOnStartup(); }
                },
                {
                    label: "Quit",
                    type: "normal",
                    click: function () { helper.quitApp(); }
                }
            ]);
            tray.setToolTip("This is my application.");
            tray.setContextMenu(contextMenu);
        });
    }
    return TrayManager;
}());
exports.TrayManager = TrayManager;
