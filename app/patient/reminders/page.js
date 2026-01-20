'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getReminders, supabase } from '@/lib/supabase';
import { Bell, Clock, ChevronLeft, Plus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { requestNotificationPermission, showInstantNotification } from '@/lib/notifications';
import toast from 'react-hot-toast';

import ReminderModal from '@/components/ReminderModal';

export default function RemindersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [patient, setPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return router.push('/login');

      const { data: patientData } = await getPatient(user.id);
      if (!patientData) {
        console.error('Patient record missing');
        // Handle gracefully, maybe redirect to complete-profile
        return setLoading(false);
      }
      setPatient(patientData);

      const { data, error } = await getReminders(patientData.id);
      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (id) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_active: false }) // Or handle differently if you have a completion table
        .eq('id', id);

      if (error) throw error;

      toast.success('Reminder completed / stopped');
      setReminders(reminders.filter(r => r.id !== id));
    } catch (error) {
      console.error(error);
      toast.error('Failed to update reminder');
    }
  };

  const testNotification = async () => {
    const tid = toast.loading('Requesting permission...');
    try {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        toast.success('Permission granted!', { id: tid });
        showInstantNotification('HealthON Test', 'This is a test notification! Your reminders are working correctly.');
      } else {
        toast.error('Notification permission denied', { id: tid });
      }
    } catch (error) {
      toast.error('Error testing notifications', { id: tid });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a2b3d]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white py-8 px-4 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-[#4a2b3d]">Health Reminders</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-3 bg-[#4a2b3d] text-white rounded-2xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-[#4a2b3d]/20 hover:opacity-90 transition-all active:scale-95"
          >
            <Plus size={18} /> Add New
          </button>
        </div>

        {/* Browser Notification Sync Card - Two Color Style */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#4a2b3d]">
                <Bell size={28} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#4a2b3d] uppercase tracking-widest">Browser Notifications</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Stay updated even when app is closed</p>
              </div>
            </div>
            <button
              onClick={testNotification}
              className="w-full md:w-auto px-6 py-3 bg-white border-2 border-[#4a2b3d] text-[#4a2b3d] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 hover:bg-[#4a2b3d] hover:text-white"
            >
              <RefreshCw size={14} /> Test Notifications
            </button>
          </div>
        </div>

        {/* Reminders List Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <Clock size={16} className="text-slate-300" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Records</span>
          </div>

          {reminders.length > 0 ? (
            reminders.map((rem) => {
              const formatReminderTime = (timeStr) => {
                if (!timeStr) return 'N/A';
                if (timeStr.includes('T')) {
                  const d = new Date(timeStr);
                  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                }
                const cleanTime = timeStr.split(':');
                if (cleanTime.length >= 2) {
                  const hour = parseInt(cleanTime[0]);
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const h12 = hour % 12 || 12;
                  return `${h12}:${cleanTime[1]} ${ampm}`;
                }
                return timeStr;
              };

              return (
                <div key={rem.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 flex items-center justify-between group hover:border-[#4a2b3d]/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 bg-slate-50 text-[#4a2b3d]">
                      <Bell size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#4a2b3d] mb-0.5">{rem.title || 'Untitled Reminder'}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {formatReminderTime(rem.reminder_time)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span>{rem.reminder_type || 'General'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => markComplete(rem.id)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-[#4a2b3d] hover:bg-[#4a2b3d]/5 rounded-2xl transition-all active:scale-90"
                  >
                    <CheckCircle size={24} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-16 rounded-[40px] border border-dashed border-slate-200 text-center">
              <AlertCircle className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">No active reminders</p>
            </div>
          )}
        </div>

        <ReminderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          patientId={patient?.id}
          onSuccess={loadData}
        />
      </div>
    </div>
  );
}