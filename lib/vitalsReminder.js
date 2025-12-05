// Daily Vitals Reminder System
import { showInstantNotification } from './notifications';
import toast from 'react-hot-toast';

/**
 * Schedule daily vitals reminder at 8 AM
 */
export const scheduleDailyVitalsReminder = () => {
    // Check every minute if it's 8 AM
    const checkTime = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // If it's 8:00 AM (within the current minute)
        if (hours === 8 && minutes === 0) {
            sendVitalsReminder();
        }
    };

    // Check immediately
    checkTime();

    // Then check every minute
    const interval = setInterval(checkTime, 60000);
    return interval;
};

/**
 * Send vitals reminder notification
 */
export const sendVitalsReminder = () => {
    const title = '🏥 Good Morning! Time to Log Your Vitals';
    const body = 'Start your day healthy! Log your vitals now to track your health journey. Click to log vitals.';

    if (Notification.permission === 'granted') {
        try {
            const notification = new Notification(title, {
                body: body,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                tag: 'daily-vitals-reminder',
                requireInteraction: true, // Stays until user interacts
                vibrate: [200, 100, 200],
                data: {
                    url: '/patient/vitals' // URL to navigate to when clicked
                }
            });

            // Handle notification click
            notification.onclick = function (event) {
                event.preventDefault();
                window.focus();
                window.location.href = '/patient/vitals';
                notification.close();
            };
        } catch (error) {
            console.error('Notification error:', error);
        }
    }

    // Also show toast notification
    toast((t) => (
        <div className="flex flex-col gap-2">
            <p className="font-bold">🏥 Good Morning!</p>
            <p className="text-sm">Time to log your daily vitals</p>
            <button
                onClick={() => {
                    window.location.href = '/patient/vitals';
                    toast.dismiss(t.id);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 mt-2"
            >
                Log Vitals Now
            </button>
        </div>
    ), {
        duration: 10000,
        icon: '🏥'
    });
};

/**
 * Check if vitals were logged today
 */
export const checkIfVitalsLoggedToday = async (patientId, supabase) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('vitals')
        .select('*')
        .eq('patient_id', patientId)
        .gte('recorded_at', today.toISOString())
        .limit(1);

    if (error) {
        console.error('Error checking vitals:', error);
        return false;
    }

    return data && data.length > 0;
};

/**
 * Send reminder if vitals not logged today
 */
export const sendReminderIfNeeded = async (patientId, supabase) => {
    const vitalsLogged = await checkIfVitalsLoggedToday(patientId, supabase);

    if (!vitalsLogged) {
        const now = new Date();
        const hours = now.getHours();

        // Send reminder at 8 AM, 12 PM, or 6 PM if not logged
        if (hours === 8 || hours === 12 || hours === 18) {
            const minutes = now.getMinutes();
            if (minutes === 0) { // Only at the top of the hour
                sendVitalsReminder();
            }
        }
    }
};

/**
 * Get motivational message based on time
 */
export const getVitalsMotivation = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
        return "🌅 Start your day right! Log your morning vitals.";
    } else if (hour < 17) {
        return "☀️ Afternoon check-in! How are your vitals today?";
    } else {
        return "🌙 Evening wellness check! Log your vitals before bed.";
    }
};
