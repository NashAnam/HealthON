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
        reminder_date: '',
        reminder_type: 'general'
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
                reminder_type: formData.reminder_type,
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
                        formData.description || `Time for your ${formData.reminder_type} reminder!`,
                        reminderDateTime
                    );
                }
            }

            toast.success('Reminder set successfully!');
            setFormData({ title: '', description: '', reminder_time: '', reminder_date: '', reminder_type: 'general' });
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
        <div className="fixed inset-0 bg-[#4a2b3d]/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#4a2b3d]">
                            <Bell className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-[#4a2b3d] uppercase tracking-tight">Set Reminder</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-300" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, reminder_type: 'general' })}
                            className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.reminder_type === 'general' ? 'bg-[#4a2b3d] text-white shadow-lg shadow-[#4a2b3d]/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            General
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, reminder_type: 'medication' })}
                            className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.reminder_type === 'medication' ? 'bg-[#4a2b3d] text-white shadow-lg shadow-[#4a2b3d]/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            Medication
                        </button>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Reminder Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Morning Walk"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4a2b3d]/20 focus:border-[#4a2b3d] transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Date</label>
                            <input
                                type="date"
                                value={formData.reminder_date}
                                onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4a2b3d]/20 focus:border-[#4a2b3d] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Time</label>
                            <input
                                type="time"
                                value={formData.reminder_time}
                                onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4a2b3d]/20 focus:border-[#4a2b3d] transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-5 bg-[#4a2b3d] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#4a2b3d]/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {submitting ? 'Setting Reminder...' : 'Confirm Schedule'}
                            {!submitting && <Clock className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
