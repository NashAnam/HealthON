import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Safe check for native platform
const getIsNative = () => {
    if (typeof window === 'undefined') return false;
    try {
        return Capacitor.isNativePlatform();
    } catch (e) {
        return false;
    }
};

const isNative = getIsNative();

export const requestNotificationPermission = async () => {
    if (typeof window === 'undefined') return false;

    if (isNative) {
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } catch (e) {
            console.error('Native permission error:', e);
            return false;
        }
    }

    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (e) {
            return false;
        }
    }

    return false;
};

export const registerServiceWorker = async () => {
    if (typeof window === 'undefined') return null;

    if (!isNative && 'serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }
    return null;
};

export const scheduleNotification = async (title, body, time, id = Math.floor(Math.random() * 100000)) => {
    if (typeof window === 'undefined') return;
    const scheduledTime = new Date(time);

    if (isNative) {
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id,
                        schedule: { at: scheduledTime },
                        sound: null,
                        attachments: null,
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
        } catch (e) {
            console.error('Native schedule error:', e);
        }
    } else {
        const now = new Date().getTime();
        const delay = scheduledTime.getTime() - now;

        if (delay > 0) {
            setTimeout(async () => {
                showInstantNotification(title, body);
            }, delay);
        }
    }
};

export const showInstantNotification = async (title, body, id = Math.floor(Math.random() * 100000)) => {
    if (typeof window === 'undefined') return;

    if (isNative) {
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id,
                        schedule: { at: new Date(Date.now() + 1000) },
                        sound: null,
                        attachments: null,
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
        } catch (e) {
            console.error('Native instant notification error:', e);
        }
    } else {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    registration.showNotification(title, {
                        body: body,
                        icon: '/icon-192x192.png',
                        badge: '/badge-72x72.png',
                        vibrate: [200, 100, 200]
                    });
                } catch (e) {
                    console.error("SW Notification failed, falling back to new Notification", e);
                    try {
                        new Notification(title, { body, icon: '/icon-192x192.png' });
                    } catch (innerE) {
                        console.error('Final notification failure:', innerE);
                    }
                }
            } else {
                try {
                    new Notification(title, {
                        body: body,
                        icon: '/icon-192x192.png',
                        badge: '/badge-72x72.png',
                        vibrate: [200, 100, 200]
                    });
                } catch (e) {
                    console.error('Standard notification failure:', e);
                }
            }
        }
    }
};

export const cancelNotification = async (id) => {
    if (typeof window === 'undefined') return;
    if (isNative) {
        try {
            await LocalNotifications.cancel({ notifications: [{ id }] });
        } catch (e) {
            console.error('Native cancel error:', e);
        }
    }
};
