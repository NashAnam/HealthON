'use client';
import { useEffect, useState } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, getCurrentUser, getPatient, getReminders } from '@/lib/supabase';
import {
    requestNotificationPermission,
    scheduleNotification,
    registerServiceWorker,
    scheduleAppointmentReminder,
    scheduleMedicationReminder,
    scheduleDailyVitalsReminder,
    scheduleTelemedicineReminder,
    schedulePrescriptionExpiryReminder
} from '@/lib/notifications';

export default function NotificationSync() {
    const [permissionStatus, setPermissionStatus] = useState('default');
    const [swRegistered, setSwRegistered] = useState(false);
    const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

    useEffect(() => {
        initializeNotifications();
    }, []);

    const initializeNotifications = async () => {
        if (typeof window === 'undefined') return;

        try {
            // 1. Register Service Worker
            const registration = await registerServiceWorker();

            if (registration) {
                setSwRegistered(true);
                console.log('✅ Service Worker registered');
            }

            // 2. Check permission status
            if ('Notification' in window) {
                setPermissionStatus(Notification.permission);

                // Show prompt if not requested yet
                const dismissed = localStorage.getItem('notification_prompt_dismissed');
                if (Notification.permission === 'default' && !dismissed) {
                    setTimeout(() => setShowPermissionPrompt(true), 3000);
                }

                // If already granted, sync notifications
                if (Notification.permission === 'granted') {
                    await syncNotifications();
                }
            }
        } catch (error) {
            console.error('Notification init error:', error);
        }
    };

    const syncNotifications = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return;

            const { data: patientData } = await getPatient(user.id);
            if (!patientData) return;

            console.log('🔄 Syncing all notifications...');

            // 1. Sync Appointments (regular + telemedicine)
            const { data: appointments } = await supabase
                .from('appointments')
                .select('*, doctors(name)')
                .eq('patient_id', patientData.id)
                .in('status', ['confirmed', 'pending'])
                .gte('appointment_date', new Date().toISOString().split('T')[0]);

            if (appointments) {
                for (const appt of appointments) {
                    // Regular appointment reminders
                    await scheduleAppointmentReminder(appt);

                    // Telemedicine-specific reminders (15 min before)
                    if (appt.appointment_type === 'telemedicine' || appt.is_telemedicine) {
                        await scheduleTelemedicineReminder(appt);
                    }
                }
                console.log(`✅ Scheduled ${appointments.length} appointment reminders`);
            }

            // 2. Sync Medication Reminders
            const { data: prescriptions } = await supabase
                .from('prescriptions')
                .select('*')
                .eq('patient_id', patientData.id)
                .order('created_at', { ascending: false })
                .limit(3); // Get last 3 prescriptions

            if (prescriptions) {
                let medicationCount = 0;
                for (const prescription of prescriptions) {
                    // Schedule prescription expiry reminders
                    await schedulePrescriptionExpiryReminder(prescription);

                    // Schedule medication reminders
                    if (prescription.medications && Array.isArray(prescription.medications)) {
                        for (const med of prescription.medications) {
                            const times = [];
                            const instr = (med.instructions || '').toLowerCase();

                            // Extract times from instructions
                            if (instr.includes('morning') || instr.includes('am')) times.push('08:00');
                            if (instr.includes('afternoon')) times.push('14:00');
                            if (instr.includes('evening') || instr.includes('pm')) times.push('19:00');
                            if (instr.includes('night')) times.push('22:00');

                            // Fallback
                            if (times.length === 0) times.push('09:00');

                            for (const time of times) {
                                await scheduleMedicationReminder(med, time);
                                medicationCount++;
                            }
                        }
                    }
                }
                console.log(`✅ Scheduled ${medicationCount} medication reminders`);
            }

            // 3. Sync Health Reminders
            const { data: reminders } = await getReminders(patientData.id);
            if (reminders) {
                let reminderCount = 0;
                for (const reminder of reminders) {
                    if (reminder.reminder_time && reminder.is_active) {
                        try {
                            const [hours, minutes] = reminder.reminder_time.split(':');
                            const scheduleDate = new Date();
                            scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                            if (scheduleDate < new Date()) {
                                scheduleDate.setDate(scheduleDate.getDate() + 1);
                            }

                            await scheduleNotification(
                                reminder.title || 'Health Reminder',
                                reminder.description || 'Time for your health check',
                                scheduleDate,
                                Math.abs(reminder.id?.toString().charCodeAt(0) || Math.random() * 10000)
                            );
                            reminderCount++;
                        } catch (err) {
                            console.error('Error scheduling reminder:', err);
                        }
                    }
                }
                console.log(`✅ Scheduled ${reminderCount} health reminders`);
            }

            // 4. Schedule Daily Vitals Reminder
            await scheduleDailyVitalsReminder();
            console.log('✅ Scheduled daily vitals reminder');

            // 5. Sync Lab Bookings
            const { data: labBookings } = await supabase
                .from('lab_bookings')
                .select('*, labs(name)')
                .eq('patient_id', patientData.id)
                .neq('status', 'cancelled')
                .gte('test_date', new Date().toISOString().split('T')[0]);

            if (labBookings) {
                for (const booking of labBookings) {
                    if (booking.test_date) {
                        const testDate = new Date(booking.test_date);
                        testDate.setHours(8, 0, 0, 0);

                        if (testDate >= new Date()) {
                            await scheduleNotification(
                                '🔬 Lab Test Reminder',
                                `You have a ${booking.test_type || 'lab test'} scheduled at ${booking.labs?.name || 'the lab'} today.`,
                                testDate,
                                Math.abs(booking.id?.toString().charCodeAt(0) || Math.random() * 10000)
                            );
                        }
                    }
                }
                console.log(`✅ Scheduled ${labBookings.length} lab test reminders`);
            }

            console.log('✅ All notifications synced successfully');
        } catch (error) {
            console.error('❌ Notification sync error:', error);
        }
    };

    const handleEnableNotifications = async () => {
        try {
            const granted = await requestNotificationPermission();

            if (granted) {
                setPermissionStatus('granted');
                setShowPermissionPrompt(false);
                toast.success('🔔 Notifications enabled! You\'ll receive reminders for appointments and medications.');

                // Sync notifications now
                await syncNotifications();
            } else {
                setPermissionStatus('denied');
                setShowPermissionPrompt(false);
                toast.error('Notifications blocked. Enable them in browser settings to receive reminders.');
            }
        } catch (error) {
            console.error('Permission error:', error);
            toast.error('Failed to enable notifications');
        }
    };

    const handleDismiss = () => {
        setShowPermissionPrompt(false);
        localStorage.setItem('notification_prompt_dismissed', 'true');
    };

    // Don't show if already granted
    if (permissionStatus === 'granted') {
        return null;
    }

    // Show permission prompt
    if (showPermissionPrompt && permissionStatus === 'default') {
        return (
            <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                                Enable Notifications?
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Get timely reminders for appointments, medications, and health check-ups.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEnableNotifications}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Check className="w-4 h-4" />
                                    Enable
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show blocked indicator if denied
    if (permissionStatus === 'denied') {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 shadow-lg">
                    <BellOff className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-red-800">
                            Notifications Blocked
                        </p>
                        <p className="text-xs text-red-600">
                            Enable in browser settings
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
