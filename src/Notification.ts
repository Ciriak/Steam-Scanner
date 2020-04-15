import { BrowserWindow, app, screen, ipcMain } from "electron";
import SteamScanner from "./app";
import { INotificationOptions } from "./interfaces/Notification.interface";
import path from "path";
const notificationSize = {
    width: 400,
    height: 100,
    margin: 10
};

const notificationDelay = 5000;

/**
 * Manage the notifications
 */
export default class NotificationsManager {
    private browserWindow?: BrowserWindow;
    private scanner: SteamScanner;
    private hideTimeout?: NodeJS.Timeout;

    constructor(scanner: SteamScanner) {
        this.scanner = scanner;
        app.on('ready', () => {
            const screenSize = screen.getPrimaryDisplay().workAreaSize;

            this.browserWindow = new BrowserWindow({
                width: notificationSize.width,
                height: notificationSize.height,
                frame: false,
                x: screenSize.width - notificationSize.width - notificationSize.margin,
                y: screenSize.height - notificationSize.height - notificationSize.margin,
                alwaysOnTop: true,
                transparent: false,
                backgroundColor: "#212121",
                skipTaskbar: true,
                show: false,
                hasShadow: false,
            });
            this.browserWindow.loadURL(path.join(app.getAppPath(), "views/notifications/index.html"));
        })


        setTimeout(() => {
            this.notification({
                message: "hello"
            })
        }, 1500)
    }
    notification(options: INotificationOptions) {

        // send the options to the notification window
        ipcMain.emit("setNotification", options);

        // show the window
        this.browserWindow?.show();

        // clear the existing timeout if needed
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        // set a timeout
        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, notificationDelay);


    }

    hide() {
        this.browserWindow?.hide();
    }
}