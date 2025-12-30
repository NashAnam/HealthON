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
                if (!patientData) return;

                // 1. Register SW & Request Permission
                await registerServiceWorker();
                const hasPermission = await requestNotificationPermission();
                if (!hasPermission) return;

                // 2. Sync Appointments
                const { data: appointmentData } = await supabase
                    .from('appointments')
                    .select('*, doctors(name)')
                    .eq('patient_id', patientData.id)
                    .eq('status', 'confirmed');

                if (appointmentData) {
                    checkUpcomingAppointments(appointmentData);
                }

                // 3. Sync Reminders
                const { data: remindersData } = await getReminders(patientData.id);
                if (remindersData) {
                    for (const reminder of remindersData) {
                        if (reminder.reminder_time && reminder.is_active) {
                            const [hours, minutes] = reminder.reminder_time.includes('T')
                                ? reminder.reminder_time.split('T')[1].split(':')
                                : reminder.reminder_time.split(':');

                            const scheduleDate = new Date();
                            scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                            if (scheduleDate < new Date()) {
                                scheduleDate.setDate(scheduleDate.getDate() + 1);
                            }

                            await scheduleNotification(
                                reminder.title,
                                reminder.description || `Time for your ${reminder.reminder_type}`,
                                scheduleDate.toISOString(),
                                // Stable ID for scheduling
                                Math.abs(reminder.id.split('-').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0))
                            );
                        }
                    }
                }

                // 4. Sync Lab Bookings
                const { data: labData } = await supabase
                    .from('lab_bookings')
                    .select('*, labs(name)')
                    .eq('patient_id', patientData.id)
                    .neq('status', 'cancelled');

                if (labData) {
                    for (const lab of labData) {
                        const testDate = new Date(lab.test_date);
                        // Morning of the test
                        testDate.setHours(8, 0, 0, 0);

                        if (testDate >= new Date()) {
                            await scheduleNotification(
                                `🔬 Lab Test Today: ${lab.test_type}`,
                                `Remember your appointment at ${lab.labs?.name || 'the lab'}`,
                                testDate.toISOString(),
                                Math.abs(lab.id.split('-').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0))
                            );
                        }
                    }
                }
            } catch (error) {
                console.error('Notification Sync Error:', error);
            }
        };

        // Run on mount
        syncNotifications();

        // Optional: Re-sync every hour
        const interval = setInterval(syncNotifications, 3600000);
        return () => clearInterval(interval);
    }, []);

    return null; // Side-effect only component
}
