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
            console.log('✅ Service Worker registered:', registration);
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
            console.log(`📅 Scheduled: ${title} at ${scheduledTime.toLocaleString()}`);
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
            console.log(`📅 Scheduled (Web): ${title} in ${Math.round(delay / 1000 / 60)} minutes`);
        } else {
            console.log(`⏭️ Skipped (Past): ${title} was scheduled for ${scheduledTime.toLocaleString()}`);
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

// ========== APPOINTMENT NOTIFICATIONS ==========
export const scheduleAppointmentReminder = async (appointment) => {
    const { appointment_date, appointment_time, doctors } = appointment;
    const doctorName = doctors?.name || 'your doctor';

    try {
        const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);

        // 1. Schedule 1 hour before
        const reminderTime = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);

        if (reminderTime > new Date()) {
            await scheduleNotification(
                '🏥 Appointment Reminder',
                `You have an appointment with ${doctorName} in 1 hour.`,
                reminderTime,
                100000 + (appointment.id ? (typeof appointment.id === 'string' ? appointment.id.charCodeAt(0) : appointment.id % 1000) : Math.floor(Math.random() * 1000))
            );
        }

        // 2. Schedule morning reminder (8 AM on the day of)
        const morningReminder = new Date(appointmentDateTime);
        morningReminder.setHours(8, 0, 0, 0);

        if (morningReminder > new Date() && morningReminder < appointmentDateTime) {
            await scheduleNotification(
                '📅 Upcoming Appointment Today',
                `Don't forget your appointment with ${doctorName} at ${appointment_time} today.`,
                morningReminder,
                200000 + (appointment.id ? (typeof appointment.id === 'string' ? appointment.id.charCodeAt(0) : appointment.id % 1000) : Math.floor(Math.random() * 1000))
            );
        }
    } catch (e) {
        console.error('Error scheduling appointment reminder:', e);
    }
};

// ========== MEDICATION NOTIFICATIONS ==========
export const scheduleMedicationReminder = async (medication, time) => {
    const title = '💊 Medication Reminder';
    const body = `Time to take your ${medication.name || 'medication'} ${medication.dosage ? `(${medication.dosage})` : ''}`;

    try {
        const [hours, minutes] = time.split(':');
        const scheduledTime = new Date();
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If time has passed today, schedule for tomorrow
        if (scheduledTime < new Date()) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        await scheduleNotification(
            title,
            body,
            scheduledTime,
            300000 + (medication.id ? (typeof medication.id === 'number' ? medication.id % 10000 : medication.id.charCodeAt(0)) : Math.floor(Math.random() * 1000))
        );
    } catch (e) {
        console.error('Error scheduling medication reminder:', e);
    }
};

// ========== DAILY VITALS REMINDER ==========
export const scheduleDailyVitalsReminder = async () => {
    const title = '❤️ Daily Health Check';
    const body = 'Time to log your vitals! Track your heart rate, blood pressure, and glucose levels.';

    try {
        const scheduledTime = new Date();
        scheduledTime.setHours(8, 0, 0, 0);

        // If 8 AM has passed today, schedule for tomorrow
        if (scheduledTime < new Date()) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        await scheduleNotification(title, body, scheduledTime, 400000);
    } catch (e) {
        console.error('Error scheduling vitals reminder:', e);
    }
};

// ========== LAB REPORT NOTIFICATIONS ==========
export const notifyLabReportReady = async (patientId, labReport) => {
    const title = '🔬 Lab Report Ready';
    const body = `Your ${labReport.test_name || 'test'} results are now available.`;

    try {
        await showInstantNotification(title, body, 500000 + (labReport.id || Math.random() * 1000));
    } catch (e) {
        console.error('Error sending lab report notification:', e);
    }
};

// ========== TELEMEDICINE NOTIFICATIONS ==========
export const scheduleTelemedicineReminder = async (appointment) => {
    const { appointment_date, appointment_time, doctors } = appointment;
    const doctorName = doctors?.name || 'your doctor';

    try {
        const sessionDateTime = new Date(`${appointment_date}T${appointment_time}`);

        // Schedule 15 minutes before
        const reminderTime = new Date(sessionDateTime.getTime() - 15 * 60 * 1000);

        if (reminderTime > new Date()) {
            await scheduleNotification(
                '💻 Telemedicine Session Starting Soon',
                `Your video consultation with ${doctorName} starts in 15 minutes. Get ready!`,
                reminderTime,
                600000 + (appointment.id ? (typeof appointment.id === 'string' ? appointment.id.charCodeAt(0) : appointment.id % 1000) : Math.floor(Math.random() * 1000))
            );
        }
    } catch (e) {
        console.error('Error scheduling telemedicine reminder:', e);
    }
};

// ========== PRESCRIPTION EXPIRY NOTIFICATIONS ==========
export const schedulePrescriptionExpiryReminder = async (prescription) => {
    try {
        if (!prescription.duration) return;

        const createdDate = new Date(prescription.created_at);
        const expiryDate = new Date(createdDate);
        expiryDate.setDate(expiryDate.getDate() + parseInt(prescription.duration));

        // Notify 3 days before expiry
        const threeDaysBefore = new Date(expiryDate);
        threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
        threeDaysBefore.setHours(9, 0, 0, 0);

        if (threeDaysBefore > new Date()) {
            await scheduleNotification(
                '⚠️ Prescription Expiring Soon',
                `Your prescription will expire in 3 days. Consider scheduling a follow-up appointment.`,
                threeDaysBefore,
                700000 + (prescription.id || Math.random() * 1000)
            );
        }

        // Notify on last day
        const lastDay = new Date(expiryDate);
        lastDay.setHours(9, 0, 0, 0);

        if (lastDay > new Date()) {
            await scheduleNotification(
                '🚨 Prescription Expires Today',
                `Your prescription expires today. Contact your doctor for a renewal if needed.`,
                lastDay,
                800000 + (prescription.id || Math.random() * 1000)
            );
        }
    } catch (e) {
        console.error('Error scheduling prescription expiry reminder:', e);
    }
};

// ========== APPOINTMENT STATUS CHANGE NOTIFICATIONS ==========
export const notifyAppointmentStatusChange = async (appointment, newStatus) => {
    const doctorName = appointment.doctors?.name || 'your doctor';

    let title = '';
    let body = '';

    switch (newStatus) {
        case 'confirmed':
            title = '✅ Appointment Confirmed';
            body = `Your appointment with ${doctorName} on ${appointment.appointment_date} has been confirmed.`;
            break;
        case 'cancelled':
            title = '❌ Appointment Cancelled';
            body = `Your appointment with ${doctorName} on ${appointment.appointment_date} has been cancelled.`;
            break;
        case 'rescheduled':
            title = '📅 Appointment Rescheduled';
            body = `Your appointment with ${doctorName} has been rescheduled. Check your appointments for details.`;
            break;
        default:
            return;
    }

    try {
        await showInstantNotification(title, body, 900000 + (appointment.id || Math.random() * 1000));
    } catch (e) {
        console.error('Error sending appointment status notification:', e);
    }
};
