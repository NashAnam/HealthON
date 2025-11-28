'use client';
import { useState } from 'react';
import { X, Clock, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { createReminder } from '@/lib/supabase';

export default function ReminderModal({ isOpen, onClose, patientId, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        reminder_time: '',
        reminder_date: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.reminder_date || !formData.reminder_time) {
            toast.error('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const reminderDateTime = `${formData.reminder_date}T${formData.reminder_time}:00`;

            const { error } = await createReminder({
                patient_id: patientId,
                reminder_type: 'medication',
                title: formData.title,
                description: formData.description || '',
                reminder_time: reminderDateTime,
                frequency: 'daily',
                is_active: true
            });

            if (error) throw error;

            // Schedule notification
            if (typeof window !== 'undefined' && 'Notification' in window) {
                const { requestNotificationPermission, scheduleNotification } = await import('@/lib/notifications');
                const hasPermission = await requestNotificationPermission();
                if (hasPermission) {
                    scheduleNotification(
                        formData.title,
                        formData.description || 'Time for your reminder!',
                        reminderDateTime
                    );
                }
            }

            toast.success('Reminder set successfully!');
            setFormData({ title: '', description: '', reminder_time: '', reminder_date: '' });
            onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error creating reminder:', error);
            toast.error(error.message || 'Failed to create reminder');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                            <Bell className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Set Reminder</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Take medication"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Take 2 tablets after breakfast"
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Date *</label>
                            <input
                                type="date"
                                value={formData.reminder_date}
                                onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Time *</label>
                            <input
                                type="time"
                                value={formData.reminder_time}
                                onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Setting...
                                </>
                            ) : (
                                <>
                                    <Clock className="w-4 h-4" />
                                    Set Reminder
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
