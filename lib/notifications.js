import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Check if we are running natively
const isNative = Capacitor.isNativePlatform();

export const requestNotificationPermission = async () => {
    if (isNative) {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
    }

    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const registerServiceWorker = async () => {
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
    const scheduledTime = new Date(time);

    if (isNative) {
        // Native Schedule
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
    } else {
        // Web Schedule
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
    if (isNative) {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id,
                    schedule: { at: new Date(Date.now() + 1000) }, // 1 sec delay to ensure it fires
                    sound: null,
                    attachments: null,
                    actionTypeId: "",
                    extra: null
                }
            ]
        });
    } else {
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
                    new Notification(title, { body, icon: '/icon-192x192.png' });
                }
            } else {
                new Notification(title, {
                    body: body,
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    vibrate: [200, 100, 200]
                });
            }
        }
    }
};

export const cancelNotification = async (id) => {
    if (isNative) {
        await LocalNotifications.cancel({ notifications: [{ id }] });
    }
    // Web notifications can't really be "cancelled" once scheduled via setTimeout easily without tracking IDs, 
    // but for this implementation we focus on the native experience.
};
