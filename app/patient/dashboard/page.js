'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getLatestVitals, getLatestAssessment, getReminders, supabase } from '@/lib/supabase';
import {
  Activity, Calendar, FileText, Bell, LogOut,
  LayoutDashboard, CreditCard, Settings, Plus,
  Stethoscope, Clock, ChevronRight, Search, AlertCircle, RefreshCw, Heart, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReminderModal from '@/components/ReminderModal';

export default function PatientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState('loading');
  const [showReminderModal, setShowReminderModal] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return router.replace('/login');

      const { data: patientData } = await getPatient(user.id);
      if (!patientData) return router.replace('/complete-profile');
      if (!patientData.consent_given) return router.replace('/patient/consent');

      setPatient(patientData);

      // 1. Check Subscription
      const endDate = patientData.subscription_end_date ? new Date(patientData.subscription_end_date) : null;
      const isActive = endDate && endDate > new Date();

      if (isActive) {
        setSubscriptionStatus('active');

        // 2. Fetch Real-time Data ONLY if active
        const { data: vitalsData } = await getLatestVitals(patientData.id);
        setVitals(vitalsData);

        const { data: assessmentData } = await getLatestAssessment(patientData.id);
        setAssessment(assessmentData);
        console.error('Error loading dashboard:', error);
        setLoading(false);
      }
    };

    const handleLogout = async () => router.push('/login');

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;

    // Subscription States
    if (subscriptionStatus === 'pending') return <SubscriptionPending />;
    if (subscriptionStatus === 'expired') return <SubscriptionExpired router={router} />;

    return (
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-indigo-100">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-72 p-4 fixed h-full z-10">
          <div className="bg-white h-full rounded-3xl p-6 flex flex-col shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">CareOn</span>
            </div>
            <nav className="flex-1 space-y-2">
              <NavItem icon={LayoutDashboard} label="Overview" active />
              <NavItem icon={Calendar} label="Appointments" onClick={() => router.push('/patient/doctor-booking')} />
              <NavItem icon={FileText} label="Records" onClick={() => router.push('/patient/lab/reports')} />
              <NavItem icon={CreditCard} label="Payments" onClick={() => router.push('/patient/payment')} />
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

        {/* Main Content */}
        <main className="flex-1 md:ml-72 p-4 md:p-8">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Hello, {patient?.name?.split(' ')[0]} 👋</h1>
              <p className="text-slate-500">{patient?.age ? `${patient.age} Yrs • ` : ''}{patient?.phone}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-indigo-600 font-bold text-lg">{patient?.name?.charAt(0) || 'P'}</div>
            </div>
          </header>

          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Your Vitals</h2>
              <div className="flex gap-2">
                <button onClick={() => router.push('/patient/vitals-insights')} className="text-sm font-bold text-violet-600 hover:bg-violet-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"><Activity className="w-4 h-4" /> Insights</button>
                <button onClick={() => router.push('/patient/vitals')} className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"><Activity className="w-4 h-4" /> Log Vitals</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <VitalCard label="Heart Rate" value={vitals?.heart_rate || '--'} unit="bpm" icon={Heart} color="rose" />
              <VitalCard label="Blood Pressure" value={vitals ? `${vitals.systolic_bp}/${vitals.diastolic_bp}` : '--'} unit="mmHg" icon={Activity} color="indigo" />
              <VitalCard label="Blood Sugar" value={vitals?.blood_sugar || '--'} unit="mg/dL" icon={Activity} color="emerald" />
              <VitalCard label="BMI" value={patient?.weight && patient?.height ? (patient.weight / ((patient.height / 100) ** 2)).toFixed(1) : '--'} unit="" icon={User} color="violet" />
            </div>
          </section>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-slate-900">Health Risk Assessment</h3>
                  {assessment && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Completed</span>}
                </div>
                {assessment ? (
                  <div className="space-y-4">
                    <p className="text-slate-600">You have completed your assessment. View your risk scores for Diabetes, Heart Health, and more.</p>
                    <div className="flex gap-4">
                      <button onClick={() => router.push('/patient/assessment/result')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20">View Full Report</button>
                      <button onClick={() => router.push('/patient/assessment')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Retake</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4"><Activity className="w-8 h-8 text-indigo-600" /></div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">Check Your Health Risks</h4>
                    <p className="text-slate-500 mb-6">Take our Unified Health Risk Assessment to get scores for Diabetes, Hypertension, and more.</p>
                    <button onClick={() => router.push('/patient/assessment')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all">Start Assessment</button>
                  </div>
                )}
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600"><FileText className="w-6 h-6" /></div>
                  <h3 className="font-bold text-xl text-slate-900">Lab Services</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => router.push('/patient/lab')} className="p-4 bg-slate-50 hover:bg-violet-50 border border-slate-100 hover:border-violet-200 rounded-2xl transition-all group text-left">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform"><Plus className="w-5 h-5 text-violet-600" /></div>
                    <p className="font-bold text-slate-900">Book Lab Test</p>
                    <p className="text-xs text-slate-500 mt-1">Home collection available</p>
                  </button>
                  <button onClick={() => router.push('/patient/lab/reports')} className="p-4 bg-slate-50 hover:bg-violet-50 border border-slate-100 hover:border-violet-200 rounded-2xl transition-all group text-left">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform"><FileText className="w-5 h-5 text-violet-600" /></div>
                    <p className="font-bold text-slate-900">View Reports</p>
                    <p className="text-xs text-slate-500 mt-1">Check past results</p>
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Stethoscope className="w-6 h-6" /></div>
                  <h3 className="font-bold text-xl text-slate-900">Connect to Doctor</h3>
                </div>
                <p className="text-slate-600 mb-6">Book appointments with verified doctors and get personalized health advice.</p>
                <button onClick={() => router.push('/patient/doctor-booking')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-3">
                  <Stethoscope className="w-5 h-5" />
                  Book Appointment
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <h3 className="font-bold text-xl text-slate-900 mb-6">Reminders</h3>
                {reminders.length > 0 ? (
                  <div className="space-y-4">
                    {reminders.map(rem => (
                      <div key={rem.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600"><Clock className="w-5 h-5" /></div>
                        <div>
                          <p className="font-bold text-slate-900">{rem.title}</p>
                          <p className="text-xs text-slate-500">{new Date(rem.reminder_time).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <h4 className="font-bold text-amber-900">Health Tip</h4>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">No reminders set. Remember to drink 8 glasses of water today and take a 30-minute walk!</p>
                    <button onClick={() => setShowReminderModal(true)} className="mt-4 text-xs font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-100 px-4 py-2 rounded-lg uppercase tracking-wide transition-all">+ Set Reminder</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ReminderModal
            isOpen={showReminderModal}
            onClose={() => setShowReminderModal(false)}
            patientId={patient?.id}
          />
        </main>
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

  const VitalCard = ({ label, value, unit, icon: Icon, color }) => {
    const colors = { rose: 'text-rose-600 bg-rose-50', indigo: 'text-indigo-600 bg-indigo-50', emerald: 'text-emerald-600 bg-emerald-50', violet: 'text-violet-600 bg-violet-50' };
    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}><Icon className="w-5 h-5" /></div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value} <span className="text-xs font-normal text-slate-400">{unit}</span></p>
      </div>
    );
  };

  const SubscriptionPending = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[32px] shadow-xl text-center max-w-md w-full border border-slate-100">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><Clock className="w-10 h-10 text-amber-600" /></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification in Progress</h2>
        <p className="text-slate-500 mb-8">We are verifying your payment. Access will be granted shortly.</p>
        <button onClick={() => window.location.reload()} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"><RefreshCw className="w-5 h-5" /> Check Status</button>
      </div>
    </div>
  );

  const SubscriptionExpired = ({ router }) => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[32px] shadow-xl text-center max-w-md w-full border border-slate-100">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6"><CreditCard className="w-10 h-10 text-indigo-600" /></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Subscription Required</h2>
        <p className="text-slate-500 mb-8">Please subscribe to access your dashboard.</p>
        <button onClick={() => router.push('/patient/payment')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">Subscribe <ChevronRight className="w-5 h-5" /></button>
      </div>
    </div>
  );