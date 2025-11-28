// Service Worker for Push Notifications
self.addEventListener('push', function (event) {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'notification',
        requireInteraction: true,
        actions: [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/patient/reminders')
        );
    }
});

self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(clients.claim());
});
