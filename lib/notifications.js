// Notification Helper Functions
export const requestNotificationPermission = async () => {
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
    if ('serviceWorker' in navigator) {
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

export const scheduleNotification = (title, body, time) => {
    const now = new Date().getTime();
    const scheduledTime = new Date(time).getTime();
    const delay = scheduledTime - now;

    if (delay > 0) {
        setTimeout(async () => {
            if (Notification.permission === 'granted') {
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.ready;
                    registration.showNotification(title, {
                        body: body,
                        icon: '/icon-192x192.png',
                        badge: '/badge-72x72.png',
                        vibrate: [200, 100, 200],
                        tag: 'reminder',
                        requireInteraction: true
                    });
                } else {
                    new Notification(title, {
                        body: body,
                        icon: '/icon-192x192.png',
                        badge: '/badge-72x72.png',
                        vibrate: [200, 100, 200],
                        tag: 'reminder',
                        requireInteraction: true
                    });
                }
            }
        }, delay);
    }
};

export const showInstantNotification = async (title, body) => {
    if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, {
                body: body,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                vibrate: [200, 100, 200]
            });
        } else {
            new Notification(title, {
                body: body,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                vibrate: [200, 100, 200]
            });
        }
    }
};
