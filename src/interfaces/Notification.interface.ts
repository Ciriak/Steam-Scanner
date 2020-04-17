export interface INotificationOptions {
    title?: string,
    message: string,
    icon?: string
}

export enum NotificationEvents {
    SET_NOTIFICATION = "setNotification",
    CLOSE_NOTIFICATION = "closeNotification"
}