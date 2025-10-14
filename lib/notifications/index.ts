export class Notification {
    constructor(public message: string, public type: 'info' | 'warning' | 'error', public timestamp: Date = new Date()) { }
}
export class NotificationManager {

    private notifications: Notification[] = [];

    addNotification(message: string, type: 'info' | 'warning' | 'error') {
        const notification = new Notification(message, type);
        this.notifications.push(notification);
    }
    getNotifications(): Notification[] {
        return this.notifications;
    }
    clearNotifications() {
        this.notifications = [];
    }
}
