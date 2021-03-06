import { BrowserWindow, app, screen, ipcMain } from "electron";
import SteamScanner from "./app";
import { INotificationOptions, NotificationEvents } from "./interfaces/Notification.interface";
import path from "path";
const notificationSize = {
    width: 400,
    height: 100,
    margin: 10
};

const notificationDelay = 10000;

/**
 * Manage the notifications
 */
export default class NotificationsManager {
    private browserWindow?: BrowserWindow;
    private scanner: SteamScanner;
    private hideTimeout?: NodeJS.Timeout;
    private displayTimeout?: NodeJS.Timeout;
    private activeNotification?: INotificationOptions;

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
                transparent: true,
                skipTaskbar: true,
                show: false,
                hasShadow: false,
                resizable: false,
                webPreferences: {
                    nodeIntegration: true
                }
            });
            // this.browserWindow.webContents.openDevTools({
            //     mode: "detach"
            // });
            this.browserWindow.loadURL(path.join(app.getAppPath(), "notification.html"));
        });


        // setTimeout(() => {
        //     this.notification({
        //         message: "ddd",
        //         title: "dddd",
        //         shouldOpenMenu: true

        //     })
        // }, 1500)

        ipcMain.on(NotificationEvents.CLOSE_NOTIFICATION, () => {
            this.close();
        });

        ipcMain.on(NotificationEvents.CLICK_NOTIFICATION, () => {

            if (this.activeNotification && this.activeNotification.shouldOpenMenu) {
                this.scanner.trayManager.tray?.popUpContextMenu();
                this.close();
            }
            else {
                this.close();
            }

        });


    }
    notification(options: INotificationOptions) {

        // stop if notifications not enabled
        if (!this.scanner.config.enableNotifications) {
            return;
        }

        // set notification duration if not specified
        if (!options.duration) {
            options.duration = notificationDelay;
        }

        if (this.displayTimeout) {
            clearTimeout(this.displayTimeout);
        }

        this.displayTimeout = setTimeout(() => {
            this.activeNotification = options;

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
        }, 1000);




    }

    close() {
        delete this.activeNotification;
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.browserWindow?.hide();
    }
}