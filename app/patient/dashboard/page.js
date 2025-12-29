'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getLatestVitals, getLatestAssessment, getReminders, getPatientAppointments, getLabBookings, signOut, supabase } from '@/lib/supabase';
import {
  Activity, Calendar, FileText, Bell, LogOut,
  LayoutDashboard, Settings, Plus,
  Stethoscope, Clock, ChevronRight, AlertCircle, Heart, User, Trash2, Pill, Watch, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReminderModal from '@/components/ReminderModal';
import { checkUpcomingAppointments } from '@/lib/appointmentNotifications';
import { sendHealthSuggestion, getRecommendedSpecializations } from '@/lib/healthSuggestions';
import { scheduleDailyVitalsReminder, sendReminderIfNeeded } from '@/lib/vitalsReminder';
import { showInstantNotification } from '@/lib/notifications';
import Header from '@/components/patient/Header';

export default function PatientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [labBookings, setLabBookings] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    loadDashboard();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // ... (Keep existing helper functions: requestNotificationPermission, deleteReminder) ...
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js');
        }
        showInstantNotification('HealthOn Notifications Enabled', 'You will now receive health reminders & updates!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteReminder = async (id) => {
    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
      setReminders(reminders.filter(r => r.id !== id));
      toast.success('Reminder deleted');
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  const loadDashboard = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return router.push('/login');

      const { data: patientData, error: patientError } = await getPatient(user.id);
      if (patientError) throw patientError;
      if (!patientData) {
        router.push('/complete-profile');
        return;
      }
      setPatient(patientData);

      const [vitalsData, assessmentData, remindersData, appointmentsData, labBookingsData, prescriptionsData] = await Promise.all([
        getLatestVitals(patientData.id).then(res => res.data),
        getLatestAssessment(patientData.id).then(res => res.data),
        getReminders(patientData.id).then(res => res.data),
        getPatientAppointments(patientData.id).then(res => res.data),
        getLabBookings(patientData.id).then(res => res.data),
        supabase.from('prescriptions').select('*, doctors(*)').eq('patient_id', patientData.id).order('created_at', { ascending: false }).then(res => res.data)
      ]);

      setVitals(vitalsData);
      setAssessment(assessmentData);
      setReminders(remindersData || []);
      setAppointments(appointmentsData || []);
      setLabBookings(labBookingsData || []);
      setPrescriptions(prescriptionsData || []);

      if (!remindersData || remindersData.length === 0) {
        setTimeout(() => sendHealthSuggestion(), 5000);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ... (Keep existing effects for reminders and vitals) ...
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      reminders.forEach(rem => {
        const remTime = new Date(rem.reminder_time);
        if (remTime > new Date(now.getTime() - 60000) && remTime <= now) {
          showInstantNotification('Health Reminder', rem.title);
        }
      });
    };
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  useEffect(() => {
    const checkAppointments = () => { if (appointments?.length > 0) checkUpcomingAppointments(appointments); };
    const interval = setInterval(checkAppointments, 60000);
    checkAppointments();
    return () => clearInterval(interval);
  }, [appointments]);

  useEffect(() => {
    const interval = scheduleDailyVitalsReminder();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkVitalsReminder = () => { if (patient?.id) sendReminderIfNeeded(patient.id, supabase); };
    checkVitalsReminder();
    const interval = setInterval(checkVitalsReminder, 60000);
    return () => clearInterval(interval);
  }, [patient]);


  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plum-600"></div></div>;

  return (
    <div className="min-h-screen bg-surface font-sans text-slate-900 pb-20">
      <Header userName={patient?.name} userImage={null} />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-10 space-y-8">

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-plum-700 to-teal-600">{patient?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-gray-500 mt-1">Here is your daily health overview.</p>
          </div>
          <button
            onClick={() => router.push('/patient/progress')}
            className="px-6 py-2.5 bg-white border border-gray-200 text-plum-700 font-semibold rounded-xl hover:bg-plum-50 hover:border-plum-200 transition-all shadow-sm"
          >
            View Progress Report
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Card 1: Track Health / Vitals */}
          <div className="glass-card p-6 flex flex-col justify-between group cursor-pointer" onClick={() => router.push('/patient/vitals')}>
            <div>
              <div className="w-12 h-12 rounded-xl bg-plum-50 flex items-center justify-center text-plum-600 mb-4 group-hover:scale-110 transition-transform">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Track Health</h3>
              <p className="text-sm text-gray-500 mt-1">Heart rate, BP, BMI & more</p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-plum-600 font-semibold text-sm">
              <span>View details</span>
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Card 2: Health Risk Assessment */}
          <div className="glass-card p-6 flex flex-col justify-between group cursor-pointer" onClick={() => router.push('/patient/assessment')}>
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4 group-hover:scale-110 transition-transform">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Check Health Risk</h3>
              <p className="text-sm text-gray-500 mt-1">Get your risk score in 10 secs</p>
            </div>
            <div className={`mt-6 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${assessment ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {assessment ? 'Assessment Completed' : 'Start Checkup'}
            </div>
          </div>

          {/* Card 3: Connect Doctors */}
          <div className="glass-card p-6 flex flex-col justify-between group cursor-pointer" onClick={() => router.push('/patient/doctor-booking')}>
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Stethoscope size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Connect Doctors</h3>
              <p className="text-sm text-gray-500 mt-1">Top specialists available</p>
            </div>
            <div className="mt-6 flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
              ))}
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 border-2 border-white">+50</div>
            </div>
          </div>

          {/* Card 4: Book Lab Tests */}
          <div className="glass-card p-6 flex flex-col justify-between group cursor-pointer" onClick={() => router.push('/patient/lab')}>
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Book Lab Tests</h3>
              <p className="text-sm text-gray-500 mt-1">Home collection & digital reports</p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-purple-600 font-semibold text-sm">
              <span>Book now</span>
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Card 5: Track Treatment & Lifestyle (Watch Integration) */}
          <div className="glass-card p-6 md:col-span-2 flex flex-col md:flex-row items-center justify-between group">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <Watch size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Track Treatment & Lifestyle</h3>
              </div>
              <p className="text-slate-500 text-sm mb-4">Sync your fitness devices to get real-time health insights.</p>

              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <Watch size={16} className="text-gray-900" />
                  <span className="text-xs font-bold text-gray-700">Apple Watch</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <Smartphone size={16} className="text-gray-900" />
                  <span className="text-xs font-bold text-gray-700">Google Fit</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <Activity size={16} className="text-gray-900" />
                  <span className="text-xs font-bold text-gray-700">Fitbit</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Heart Rate</p>
                  <p className="text-lg font-bold text-gray-900">--</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Steps</p>
                  <p className="text-lg font-bold text-gray-900">--</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Sleep</p>
                  <p className="text-lg font-bold text-gray-900">--</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Activity</p>
                  <p className="text-lg font-bold text-gray-900">--</p>
                </div>
              </div>
            </div>

            {/* Visual Graphic Hint */}
            <div className="hidden md:block w-32 h-32 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-plum-100 to-teal-50 rounded-full opacity-50 blur-xl"></div>
              <img src="/watch-mock.png" alt="" className="relative z-10 w-full h-full object-contain opacity-80" onError={(e) => e.target.style.display = 'none'} />
            </div>
          </div>

        </div>

        {/* Reminders Modal */}
        <ReminderModal
          isOpen={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          patientId={patient?.id}
          onSuccess={loadDashboard}
        />
      </main>
    </div>
  );
}