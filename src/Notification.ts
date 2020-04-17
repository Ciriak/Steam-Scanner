import { BrowserWindow, app, screen, ipcMain } from "electron";
import SteamScanner from "./app";
import { INotificationOptions, NotificationEvents } from "./interfaces/Notification.interface";
import path from "path";
const notificationSize = {
    width: 400,
    height: 100,
    margin: 10
};

const notificationDelay = 8000;

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
                webPreferences: {
                    nodeIntegration: true
                }
            });
            this.browserWindow.webContents.openDevTools({
                mode: "detach"
            });
            console.log(path.join(app.getAppPath(), "views/notification/index.html"))
            this.browserWindow.loadURL(path.join(app.getAppPath(), "notification.html"));
        });



        ipcMain.on(NotificationEvents.CLOSE_NOTIFICATION, () => {
            this.close();
        });
    }
    notification(options: INotificationOptions) {
        // send the options to the notification window
        this.browserWindow?.webContents.send(NotificationEvents.SET_NOTIFICATION, options)



        // show the window
        this.browserWindow?.show();

        // clear the existing timeout if needed
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        // set a timeout
        this.hideTimeout = setTimeout(() => {
            this.close();
        }, notificationDelay);


    }

    close() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.browserWindow?.hide();
    }
}