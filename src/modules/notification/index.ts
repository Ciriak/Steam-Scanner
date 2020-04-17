import "./styles.scss";

import { ipcRenderer } from "electron"
import { NotificationEvents, INotificationOptions } from "../../interfaces/Notification.interface";
import defaultIcon from "../../assets/scanner.png";


ipcRenderer.on(NotificationEvents.SET_NOTIFICATION, (event, options: INotificationOptions) => {
    // tslint:disable-next-line: no-console
    console.log(event, options)

    const titleElement: HTMLElement = document.getElementById("notification-title") as HTMLElement;
    titleElement.textContent = options.title || "";

    const messageContent: HTMLElement = document.getElementById("notification-message") as HTMLElement;
    messageContent.textContent = options.message || "";

    const imageContent: HTMLImageElement = document.getElementById("notification-icon") as HTMLImageElement;
    imageContent.src = options.icon || defaultIcon;

});

declare let window: any;
/**
 * Notify the main process to close the window
 */
window.closeNotification = () => {
    ipcRenderer.send(NotificationEvents.CLOSE_NOTIFICATION);
}