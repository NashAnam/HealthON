'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getLatestVitals, getLatestAssessment, getReminders, getPatientAppointments, getLabBookings, signOut, supabase } from '@/lib/supabase';
import {
  Activity, Calendar, FileText, Bell, LogOut,
  LayoutDashboard, Settings, Plus,
  Stethoscope, Clock, ChevronRight, AlertCircle, Heart, User, Trash2, Pill
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReminderModal from '@/components/ReminderModal';
import { AppointmentsSection, LabBookingsSection } from '@/components/BookingsDisplay';
import { PrescriptionsSection } from '@/components/PrescriptionsDisplay';
import { checkUpcomingAppointments } from '@/lib/appointmentNotifications';
import { sendHealthSuggestion, getRecommendedSpecializations } from '@/lib/healthSuggestions';
import { scheduleDailyVitalsReminder, sendReminderIfNeeded } from '@/lib/vitalsReminder';
import { showInstantNotification } from '@/lib/notifications';

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
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    loadDashboard();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

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
        showInstantNotification(
          'HealthOn Notifications Enabled',
          'You will now receive health reminders and updates!'
        );
      } else {
        toast.error('Notifications denied. Please enable them in browser settings.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const deleteReminder = async (id) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReminders(reminders.filter(r => r.id !== id));
      toast.success('Reminder deleted');
    } catch (error) {
      console.error('Error deleting reminder:', error);
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

      // Load all data in parallel for speed
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

      if (assessmentData) {
        setRecommendedDoctors(getRecommendedSpecializations(assessmentData));
      }

      // Send health suggestion if no reminders
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

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      router.replace('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // Check for due reminders every minute
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

  // Check for upcoming appointments
  useEffect(() => {
    const checkAppointments = () => {
      if (appointments?.length > 0) checkUpcomingAppointments(appointments);
    };
    const interval = setInterval(checkAppointments, 60000);
    checkAppointments();
    return () => clearInterval(interval);
  }, [appointments]);

  // Schedule daily vitals reminder
  useEffect(() => {
    const interval = scheduleDailyVitalsReminder();
    return () => clearInterval(interval);
  }, []);

  // Check if vitals reminder needed
  useEffect(() => {
    const checkVitalsReminder = () => {
      if (patient?.id) sendReminderIfNeeded(patient.id, supabase);
    };
    checkVitalsReminder();
    const interval = setInterval(checkVitalsReminder, 60000);
    return () => clearInterval(interval);
  }, [patient]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 pb-20 md:pb-0">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 p-4 fixed h-full z-10">
        <div className="bg-white h-full rounded-3xl p-6 flex flex-col shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">HealthOn</span>
          </div>
          <nav className="flex-1 space-y-2">
            <NavItem icon={LayoutDashboard} label="Overview" active />
            <NavItem icon={Calendar} label="Appointments" onClick={() => router.push('/patient/doctor-booking')} />
            <NavItem icon={FileText} label="Records" onClick={() => router.push('/patient/lab/reports')} />
            <NavItem icon={Settings} label="Settings" onClick={() => router.push('/patient/settings')} />
          </nav>
          <div className="mt-auto pt-6 border-t border-slate-100">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all group">
              <LogOut className="w-5 h-5 transition-colors" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white z-20 px-4 py-3 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900">HealthOn</span>
        </div>
        <button onClick={handleLogout} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 mt-14 md:mt-0 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Hello, {patient?.name?.split(' ')[0]} 👋</h1>
            <p className="text-slate-500 text-sm md:text-base">Welcome back to your health dashboard.</p>
          </div>
          <div className="hidden md:block w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-indigo-600 font-bold text-lg">{patient?.name?.charAt(0) || 'P'}</div>
          </div>
        </header>

        {/* Vitals Section - Single, Clean */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">Your Vitals</h2>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/patient/vitals-insights')}
                className="text-sm font-bold text-violet-600 hover:bg-violet-50 px-3 py-2 rounded-xl transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden md:inline">Insights</span>
              </button>
              <button
                onClick={() => router.push('/patient/vitals')}
                className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                Log Vitals
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VitalCard label="Heart Rate" value={vitals?.heart_rate || '--'} unit="bpm" icon={Heart} color="rose" />
            <VitalCard label="Blood Pressure" value={vitals ? `${vitals.systolic_bp}/${vitals.diastolic_bp}` : '--'} unit="mmHg" icon={Activity} color="indigo" />
            <VitalCard label="Blood Sugar" value={vitals?.blood_sugar || '--'} unit="mg/dL" icon={Activity} color="emerald" />
            <VitalCard
              label="BMI"
              value={patient?.weight && patient?.height ? (patient.weight / ((patient.height / 100) ** 2)).toFixed(1) : 'Update Profile'}
              unit=""
              icon={User}
              color="violet"
              onClick={!(patient?.weight && patient?.height) ? () => router.push('/patient/settings') : undefined}
            />
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Main Actions & Data */}
          <div className="lg:col-span-2 space-y-6">

            {/* Health Risk Assessment */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-slate-900">Health Risk Assessment</h3>
                {assessment && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Completed</span>}
              </div>
              {assessment ? (
                <div className="space-y-4">
                  <p className="text-slate-600">You have completed your assessment. View your risk scores for Diabetes, Heart Health, and more.</p>
                  <div className="flex gap-4">
                    <button onClick={() => router.push('/patient/assessment/result')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20">View Report</button>
                    <button onClick={() => router.push('/patient/assessment')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Retake</button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-500 mb-6">Take our Unified Health Risk Assessment to get scores for Diabetes, Hypertension, and more.</p>
                  <button onClick={() => router.push('/patient/assessment')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all">Start Assessment</button>
                </div>
              )}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Connect to Doctor */}
              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Stethoscope className="w-6 h-6" /></div>
                  <h3 className="font-bold text-lg text-slate-900">Find a Doctor</h3>
                </div>
                <p className="text-slate-500 text-sm mb-6">Book appointments with verified specialists.</p>
                <button onClick={() => router.push('/patient/doctor-booking')} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3 rounded-xl font-bold transition-colors">
                  Book Appointment
                </button>
              </div>

              {/* Lab Services */}
              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600"><FileText className="w-6 h-6" /></div>
                  <h3 className="font-bold text-lg text-slate-900">Lab Tests</h3>
                </div>
                <p className="text-slate-500 text-sm mb-6">Home collection and digital reports.</p>
                <div className="flex gap-2">
                  <button onClick={() => router.push('/patient/lab')} className="flex-1 bg-violet-50 hover:bg-violet-100 text-violet-700 py-3 rounded-xl font-bold transition-colors text-sm">Book Test</button>
                  <button onClick={() => router.push('/patient/lab/reports')} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl font-bold transition-colors text-sm">Reports</button>
                </div>
              </div>
            </div>

            {/* Data Sections */}
            <AppointmentsSection appointments={appointments} />
            <LabBookingsSection labBookings={labBookings} />
            <PrescriptionsSection prescriptions={prescriptions} />
          </div>

          {/* Right Column: Reminders */}
          <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900">Reminders</h3>
                </div>

                {/* Notification Permission Button (Mobile/Check) */}
                {(notificationPermission !== 'granted' || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                  <button
                    onClick={requestNotificationPermission}
                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                    title="Enable Notifications"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowReminderModal(true)}
                className="w-full mb-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Reminder
              </button>

              {reminders.length > 0 ? (
                <div className="space-y-3">
                  {reminders.map(rem => (
                    <div key={rem.id} className="p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md rounded-2xl transition-all group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{rem.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(rem.reminder_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {new Date(rem.reminder_time).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteReminder(rem.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No reminders yet</p>
                  <p className="text-xs text-slate-400 mt-1">Stay on top of your meds & habits</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <ReminderModal
          isOpen={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          patientId={patient?.id}
          onSuccess={loadDashboard}
        />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20 px-6 py-3 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-pb">
        <MobileNavItem icon={LayoutDashboard} label="Home" active onClick={() => { }} />
        <MobileNavItem icon={Calendar} label="Book" onClick={() => router.push('/patient/doctor-booking')} />
        <MobileNavItem icon={Plus} label="Add" onClick={() => setShowReminderModal(true)} primary />
        <MobileNavItem icon={FileText} label="Records" onClick={() => router.push('/patient/lab/reports')} />
        <MobileNavItem icon={Settings} label="Settings" onClick={() => router.push('/patient/settings')} />
      </nav>
    </div>
  );
}

// Sub-components
const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}>
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
    {active && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
  </button>
);

const MobileNavItem = ({ icon: Icon, label, active, primary, onClick }) => {
  if (primary) {
    return (
      <button onClick={onClick} className="-mt-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-600/30 hover:scale-105 transition-transform active:scale-95">
        <Icon className="w-6 h-6" />
      </button>
    );
  }
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

const VitalCard = ({ label, value, unit, icon: Icon, color, onClick }) => {
  const colors = { rose: 'text-rose-600 bg-rose-50', indigo: 'text-indigo-600 bg-indigo-50', emerald: 'text-emerald-600 bg-emerald-50', violet: 'text-violet-600 bg-violet-50' };
  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full ${onClick ? 'cursor-pointer hover:border-indigo-200 transition-colors' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className={`font-bold text-slate-900 ${value === 'Update Profile' ? 'text-xs text-indigo-600' : 'text-xl'}`}>
          {value} <span className="text-xs font-normal text-slate-400">{unit}</span>
        </p>
      </div>
    </div>
  );
};