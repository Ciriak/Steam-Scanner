export interface INotificationOptions {
    title?: string,
    message: string,
    icon?: string,
    /**
     * True if a click on the notification should open the context menu
     */
    shouldOpenMenu?: boolean;
}

export enum NotificationEvents {
    SET_NOTIFICATION = "setNotification",
    CLOSE_NOTIFICATION = "closeNotification",
    CLICK_NOTIFICATION = "clickNotification"
}