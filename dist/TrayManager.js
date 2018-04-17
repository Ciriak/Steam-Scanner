"use strict";
exports.__esModule = true;
var path = require("path");
var _a = require("electron"), app = _a.app, Menu = _a.Menu, MenuItem = _a.MenuItem, Tray = _a.Tray;
var SteamerHelpers_1 = require("./SteamerHelpers");
var helper = new SteamerHelpers_1.SteamerHelpers();
var TrayManager = /** @class */ (function () {
    function TrayManager(steamer) {
        var tray = null;
        var launchOnStartup = helper.getConfig("launchOnStartup");
        var enableNotifications = helper.getConfig("enableNotifications");
        tray = new Tray(path.join(__dirname, "assets/steamer.png"));
        var contextMenu = Menu.buildFromTemplate([
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
                click: function () {
                    steamer.scan();
                }
            },
            {
                label: "Notifications",
                type: "checkbox",
                checked: enableNotifications,
                click: function () {
                    helper.toggleNotifications();
                }
            },
            {
                label: "Launch On Startup",
                type: "checkbox",
                checked: launchOnStartup,
                click: function () {
                    helper.toggleLaunchOnStartup();
                }
            },
            {
                label: "Quit",
                type: "normal",
                click: function () {
                    helper.quitApp();
                }
            }
        ]);
        tray.setToolTip(steamer.versionLabel);
        tray.setContextMenu(contextMenu);
    }
    return TrayManager;
}());
exports.TrayManager = TrayManager;
