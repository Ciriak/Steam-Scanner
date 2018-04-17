"use strict";
exports.__esModule = true;
var path = require("path");
var _a = require("electron"), app = _a.app, Menu = _a.Menu, MenuItem = _a.MenuItem, Tray = _a.Tray;
var ScannerHelpers_1 = require("./ScannerHelpers");
var helper = new ScannerHelpers_1.ScannerHelpers();
var TrayManager = /** @class */ (function () {
    function TrayManager(scanner) {
        var tray = null;
        var launchOnStartup = helper.getConfig("launchOnStartup");
        var enableNotifications = helper.getConfig("enableNotifications");
        tray = new Tray(path.join(__dirname, "assets/scanner.png"));
        var contextMenu = Menu.buildFromTemplate([
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
                click: function () {
                    scanner.scan();
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
        tray.setToolTip(scanner.versionLabel);
        tray.setContextMenu(contextMenu);
    }
    return TrayManager;
}());
exports.TrayManager = TrayManager;
