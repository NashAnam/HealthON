'use client';

import { useEffect } from 'react';
import { registerServiceWorker, requestNotificationPermission } from '@/lib/notifications';

export default function SWRegistration() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const initSW = async () => {
                try {
                    // Register the Service Worker
                    const registration = await registerServiceWorker();

                    if (registration) {
                        console.log('SW Registration successful');
                        // Optionally request permissions here if not already granted
                        // to ensure the user is prompted for PWA capabilities
                        if (Notification.permission === 'default') {
                            await requestNotificationPermission();
                        }
                    }
                } catch (error) {
                    console.error('SW init failed:', error);
                }
            };

            initSW();
        }
    }, []);

    return null;
}
