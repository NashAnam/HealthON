'use client';
import { useEffect } from 'react';
import { supabase, getCurrentUser, getPatient, getReminders } from '@/lib/supabase';
import { checkUpcomingAppointments } from '@/lib/appointmentNotifications';
import { requestNotificationPermission, scheduleNotification, registerServiceWorker } from '@/lib/notifications';

export default function NotificationSync() {
    useEffect(() => {
        const syncNotifications = async () => {
            try {
                const user = await getCurrentUser();
                if (!user || !supabase) return;

                const { data: patientData } = await getPatient(user.id);
                if (!patientData || !patientData.id) return;

                // 1. Register SW & Request Permission (Safe on mobile/web)
                try {
                    await registerServiceWorker();
                    await requestNotificationPermission();
                } catch (e) {
                    console.warn('SW/Permission Error:', e);
                }

                // 2. Sync Appointments
                try {
                    const { data: appointmentData } = await supabase
                        .from('appointments')
                        .select('*, doctors(name)')
                        .eq('patient_id', patientData.id)
                        .eq('status', 'confirmed');

                    if (appointmentData) {
                        checkUpcomingAppointments(appointmentData);
                    }
                } catch (e) {
                    console.error('Appt Sync Error:', e);
                }

                // 3. Sync Reminders
                try {
                    const { data: remindersData } = await getReminders(patientData.id);
                    if (remindersData && Array.isArray(remindersData)) {
                        for (const reminder of remindersData) {
                            if (reminder.reminder_time && reminder.is_active) {
                                try {
                                    // Robust Time Parsing
                                    let hours = 0;
                                    let minutes = 0;

                                    if (reminder.reminder_time.includes('T')) {
                                        const timePart = reminder.reminder_time.split('T')[1];
                                        if (timePart) {
                                            const parts = timePart.split(':');
                                            hours = parseInt(parts[0] || '0');
                                            minutes = parseInt(parts[1] || '0');
                                        }
                                    } else {
                                        const parts = reminder.reminder_time.split(':');
                                        hours = parseInt(parts[0] || '0');
                                        minutes = parseInt(parts[1] || '0');
                                    }

                                    if (isNaN(hours) || isNaN(minutes)) continue;

                                    const scheduleDate = new Date();
                                    scheduleDate.setHours(hours, minutes, 0, 0);

                                    // If time has passed today, schedule for tomorrow
                                    if (scheduleDate < new Date()) {
                                        scheduleDate.setDate(scheduleDate.getDate() + 1);
                                    }

                                    const stableId = reminder.id ?
                                        Math.abs(reminder.id.toString().split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0)) :
                                        Math.floor(Math.random() * 100000);

                                    await scheduleNotification(
                                        reminder.title || 'Health Reminder',
                                        reminder.description || `Time for your ${reminder.reminder_type || 'checkup'}`,
                                        scheduleDate.toISOString(),
                                        stableId
                                    );
                                } catch (innerError) {
                                    console.error('Individual Reminder Error:', innerError);
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error('Reminder Sync Error:', e);
                }

                // 4. Sync Lab Bookings
                try {
                    const { data: labData } = await supabase
                        .from('lab_bookings')
                        .select('*, labs(name)')
                        .eq('patient_id', patientData.id)
                        .neq('status', 'cancelled');

                    if (labData && Array.isArray(labData)) {
                        for (const lab of labData) {
                            if (!lab.test_date) continue;
                            try {
                                const testDate = new Date(lab.test_date);
                                if (isNaN(testDate.getTime())) continue; // Safari fix

                                // Morning of the test (8:00 AM)
                                testDate.setHours(8, 0, 0, 0);

                                if (testDate >= new Date()) {
                                    const stableId = lab.id ?
                                        Math.abs(lab.id.toString().split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0)) :
                                        Math.floor(Math.random() * 100000);

                                    await scheduleNotification(
                                        `🔬 Lab Test Today: ${lab.test_type || 'Medical Test'}`,
                                        `Remember your appointment at ${lab.labs?.name || 'the lab'}`,
                                        testDate.toISOString(),
                                        stableId
                                    );
                                }
                            } catch (innerError) {
                                console.error('Individual Lab Sync Error:', innerError);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Lab Sync Error:', e);
                }
            } catch (error) {
                console.error('Global Notification Sync Error:', error);
            }
        };

        // Run on mount
        syncNotifications();

        // Optional: Re-sync every hour
        const interval = setInterval(syncNotifications, 3600000);
        return () => clearInterval(interval);
    }, []);

    return null;
}
