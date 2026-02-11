'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, supabase, signOut } from '@/lib/supabase';
import { useSidebar } from '@/lib/SidebarContext';
import { Calendar, User, Activity, Clock, Video, MapPin, LogOut, FileText, Users, ArrowRight, Check, X, MoreHorizontal, Search, Settings, Plus, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
  const router = useRouter();
  const { toggle, isOpen } = useSidebar();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [newRequests, setNewRequests] = useState([]);
  const [patientsByStatus, setPatientsByStatus] = useState({ normal: [], moderate: [], critical: [] });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayApts: 0,
    totalPatients: 0,
    prescriptions: 0,
    newRequests: 0
  });
  const [isConsulting, setIsConsulting] = useState(false);
  const [consultingAptId, setConsultingAptId] = useState(null);
  const [isTelemedicine, setIsTelemedicine] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return router.push('/login');

      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!doctorData) {
        const { data: patientData } = await supabase.from('patients').select('id').eq('user_id', user.id).maybeSingle();
        if (patientData) {
          toast.error('Access restricted: You are registered as a Patient.');
          return router.push('/patient/dashboard');
        }
        return router.push('/complete-profile');
      }
      setDoctor(doctorData);

      const today = new Date().toLocaleDateString('en-CA');
      const { data: aptData } = await supabase
        .from('appointments')
        .select(`*, patients (*)`)
        .eq('doctor_id', doctorData.id); // Remove ordering here to handle filtering first

      // confirmed for EXACTLY today
      const todayApts = aptData?.filter(a => a.appointment_date === today && a.status === 'confirmed') || [];
      // all pending regardless of date (so doctor sees them immediately)
      const requests = aptData?.filter(a => a.status === 'pending') || [];

      setAppointments(todayApts.sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || '')));
      setNewRequests(requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));

      // Fetch Total Unique Patients
      const { count: patientCount } = await supabase
        .from('appointments')
        .select('patient_id', { count: 'exact', head: true })
        .eq('doctor_id', doctorData.id);

      // Fetch Prescriptions Count
      const { count: rxCount } = await supabase
        .from('prescriptions')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctorData.id);

      setStats({
        todayApts: todayApts.length,
        totalPatients: patientCount || 0,
        prescriptions: rxCount || 0,
        newRequests: requests.length
      });

      setPatientsByStatus({
        normal: aptData?.slice(0, 2).map(a => a.patients).filter(Boolean) || [],
        moderate: aptData?.slice(2, 3).map(a => a.patients).filter(Boolean) || [],
        critical: aptData?.slice(3, 4).map(a => a.patients).filter(Boolean) || []
      });

      // Schedule notifications for doctor
      try {
        const { requestNotificationPermission, scheduleExpertAppointmentReminder, showInstantNotification } = await import('@/lib/notifications');
        const hasPermission = await requestNotificationPermission();

        if (hasPermission) {
          // 1. Schedule reminders for today's confirmed appointments
          for (const apt of todayApts) {
            await scheduleExpertAppointmentReminder(apt);
          }

          // 2. Notify if there are new pending requests
          if (requests.length > 0) {
            await showInstantNotification(
              '🆕 New Requests',
              `You have ${requests.length} new patient ${requests.length === 1 ? 'request' : 'requests'} waiting for approval.`
            );
          }
        }
      } catch (notifErr) {
        console.error('Doctor notif error:', notifErr);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };


  const confirmAppointment = async (id) => {
    const { error } = await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id);
    if (!error) {
      toast.success('Appointment confirmed');
      loadData();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-plum-100 border-t-plum-800 rounded-full animate-spin mb-4" />
      <p className="text-plum-800 font-black uppercase tracking-widest text-sm">Loading Doctor Suite...</p>
    </div>
  );

  if (doctor && !doctor.verified) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 lg:pl-64 relative overflow-hidden">
        {/* Dynamic Background Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-plum-100/30 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -left-[10%] w-[30%] h-[50%] bg-teal-50/40 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-xl w-full text-center relative z-10 space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-xl border border-plum-100 flex items-center justify-center mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-plum-50 opacity-10 group-hover:opacity-20 transition-opacity" />
            <Clock className="w-12 h-12 text-plum-800 animate-pulse" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">
              Verification <span className="text-plum-800">Pending</span>
            </h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              Hello, <span className="text-plum-700 font-bold">{doctor.name}</span>! Your profile is currently under review by our medical administration team.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 text-left">
            {[
              { icon: <Check className="w-4 h-4 text-teal-600" />, text: "Professional credentials check", status: "Ongoing" },
              { icon: <Check className="w-4 h-4 text-teal-600" />, text: "Medical license verification", status: "Ongoing" },
              { icon: <Check className="w-4 h-4 text-teal-600" />, text: "Admin security clearance", status: "Ongoing" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-sm font-bold text-gray-700">{item.text}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5a8a7a] bg-[#5a8a7a]/5 px-3 py-1 rounded-full whitespace-nowrap">
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] leading-loose">
            You will receive a notification once your account <br /> is activated for clinical practice.
          </p>

          <button
            onClick={async () => { await signOut(); router.push('/'); }}
            className="px-10 py-4 bg-plum-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-plum-800/20"
          >
            Logout to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#FDFDFD] pb-12 transition-all duration-300 w-full max-w-[100vw] ${isOpen ? 'lg:pl-72' : 'lg:pl-0'}`}>
      {/* Decorative Ellipses (Blobs) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-plum-100/40 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 60, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-teal-50/50 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[20%] w-[30%] h-[40%] bg-plum-50/30 rounded-full blur-[110px]"
        />
      </div>

      <div className="relative z-10">
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 -ml-2 text-gray-400 hover:text-plum-800 transition-colors">
              <MoreHorizontal size={24} />
            </button>
            <div className="w-9 h-9 flex items-center justify-center p-1">
              <img src="/logo.png" alt="HealthON Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 leading-none">Health<span className="text-[#648C81]">ON</span></h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#5D2A42] mt-1">Doctor Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 focus-within:ring-2 focus-within:ring-plum-500/20 transition-all">
              <Search size={18} className="text-gray-400" />
              <input type="text" placeholder="Search patients..." className="bg-transparent border-none focus:outline-none text-sm font-medium w-48" />
            </div>
            <div className="h-8 w-[1px] bg-gray-100 mx-1 md:mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">
                  {doctor?.name?.toLowerCase().startsWith('dr') ? doctor.name : `Dr. ${doctor?.name || 'XYZ'}`}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{doctor?.specialty || 'General Physician'}</p>
              </div>
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                onClick={() => router.push('/doctor/profile')}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-lg overflow-hidden shrink-0 cursor-pointer"
              >
                {doctor?.name?.[0] || 'D'}
              </motion.div>
            </div>
            <button onClick={() => router.push('/')} className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 md:mb-10"
          >
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight text-center md:text-left">
              {!mounted ? 'Hello' : (new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening')}, {' '}
              <span className="text-plum-800">
                {doctor?.name?.toLowerCase().startsWith('dr')
                  ? doctor.name.split(' ').slice(1).join(' ')
                  : doctor?.name?.split(' ')[0] || 'Doctor'}
              </span>! 👋
            </h2>
            <p className="text-gray-500 mt-2 font-medium text-center md:text-left max-w-2xl px-4 md:px-0">
              You have <span className="text-plum-600 font-bold">{stats.todayApts} {stats.todayApts === 1 ? 'appointment' : 'appointments'}</span> scheduled for today. Your patients are waiting for your care.
            </p>
          </motion.div>

          {/* Stats Grid - High Density Mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-10">
            <StatCard label="Appointments" value={stats.todayApts} icon={<Calendar className="w-5 h-5 text-plum-600" />} color="plum" delay={0.1} onClick={() => router.push('/doctor/opd')} />
            <StatCard label="Patients" value={stats.totalPatients} icon={<Users className="w-5 h-5 text-teal-600" />} color="teal" delay={0.2} onClick={() => router.push('/doctor/patients')} />
            <StatCard label="Prescriptions" value={stats.prescriptions} icon={<FileText className="w-5 h-5 text-rose-600" />} color="rose" delay={0.3} onClick={() => router.push('/doctor/prescriptions')} />
            <StatCard label="Requests" value={stats.newRequests} icon={<Clock className="w-5 h-5 text-amber-600" />} color="amber" delay={0.4} onClick={() => router.push('/doctor/opd?status=pending')} />
          </div>

          <div className="grid grid-cols-1 gap-12">
            {/* Today's Appointments Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight">
                    <span className="w-1.5 h-6 bg-plum-800 rounded-full"></span> Today's Appointments
                  </h3>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 mt-1">
                    {mounted ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Loading Date...'}
                  </p>
                </div>
                <button onClick={() => router.push('/doctor/opd')} className="text-[10px] font-black text-plum-600 uppercase tracking-widest hover:bg-plum-100 transition-colors px-4 py-2 bg-plum-50 rounded-xl">Full Schedule</button>
              </div>

              <div className="grid gap-4">
                {appointments.length > 0 ? (
                  <AnimatePresence>
                    {appointments.map((apt, idx) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <AppointmentCard
                          apt={apt}
                          idx={idx}
                          onStart={() => {
                            setSelectedPatient(apt.patients);
                            setConsultingAptId(apt.id);
                            setIsTelemedicine(apt.consultation_type === 'telemedicine');
                            setIsConsulting(true);
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 py-20 text-center"
                  >
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                      <Clock size={32} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">No active appointments for today</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">
                      Check "New Requests" below to approve incoming patient bookings <br /> or visit the <span className="text-plum-600 cursor-pointer" onClick={() => router.push('/doctor/opd')}>Full Schedule</span> for future dates.
                    </p>
                  </motion.div>
                )}
              </div>
            </section>

            {/* New Appointment Requests Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span> Incoming Requests
                  </h3>
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest ml-4 mt-1">Pending approval</p>
                </div>
              </div>
              <div className="bg-amber-50/30 rounded-[2.5rem] border border-amber-100/50 p-4 md:p-8">
                {newRequests.length > 0 ? (
                  <div className="grid gap-4">
                    {newRequests.map((req, idx) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <RequestCard
                          req={req}
                          idx={idx}
                          onView={() => setSelectedPatient(req.patients)}
                          onConfirm={() => confirmAppointment(req.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-100">
                      <Check size={24} className="text-amber-500" />
                    </div>
                    <p className="text-sm font-black text-amber-900/40 uppercase tracking-widest">Everything caught up! No active requests.</p>
                  </div>
                )}
              </div>
            </section>
          </div>


        </div>

        {/* Patient Consultation Modal */}
        <AnimatePresence>
          {isConsulting && selectedPatient && (
            <ConsultationModal
              patient={selectedPatient}
              appointmentId={consultingAptId}
              isTelemedicine={isTelemedicine}
              onClose={() => {
                setIsConsulting(false);
                setConsultingAptId(null);
                setIsTelemedicine(false);
                loadData(); // Reload to reflect completion
              }}
            />
          )}
        </AnimatePresence>

        {/* Basic Detail Modal (Legacy - for non-consultation flows) */}
        <AnimatePresence>
          {selectedPatient && !isConsulting && (
            <PatientDetailModal
              patient={selectedPatient}
              onClose={() => setSelectedPatient(null)}
              onConfirm={() => {
                const req = newRequests.find(r => r.patient_id === selectedPatient.id);
                if (req) confirmAppointment(req.id);
                setSelectedPatient(null);
              }}
              isConfirmation={newRequests.some(r => r.patient_id === selectedPatient.id)}
            />
          )}
        </AnimatePresence>
      </div>
    </div >
  );
}


// Sub-components
function StatCard({ label, value, icon, color, delay = 0, onClick }) {
  const themes = {
    plum: 'bg-plum-50/50 border-plum-100',
    teal: 'bg-teal-50/50 border-teal-100',
    rose: 'bg-rose-50/50 border-rose-100',
    amber: 'bg-amber-50/50 border-amber-100'
  };
  const iconBgs = {
    plum: 'bg-plum-100',
    teal: 'bg-teal-100',
    rose: 'bg-rose-100',
    amber: 'bg-amber-100'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`p-3 md:p-6 rounded-2xl md:rounded-[2rem] border ${themes[color]} bg-white shadow-sm hover:shadow-xl hover:shadow-${color}-500/5 transition-all group relative overflow-hidden cursor-pointer`}
    >
      <div className="flex justify-between items-start mb-2 md:mb-4">
        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${iconBgs[color]} flex items-center justify-center group-hover:scale-110 transition-transform relative z-10`}>
          {icon}
        </div>
        <MoreHorizontal className="text-gray-300 relative z-10 w-4 h-4 md:w-5 md:h-5" />
      </div>
      <div className="relative z-10">
        <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <h4 className="text-lg md:text-2xl font-black text-gray-900 mt-1">{value}</h4>
      </div>
      {/* Decorative background element */}
      <div className={`absolute -right-4 -bottom-4 w-16 h-16 md:w-24 md:h-24 ${iconBgs[color]} opacity-10 rounded-full blur-3xl`} />
    </motion.div>
  );
}

function AppointmentCard({ apt, idx, onStart }) {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 bg-white rounded-3xl border border-gray-100 hover:border-plum-200 hover:shadow-lg hover:shadow-plum-500/5 transition-all group gap-4 relative overflow-hidden">
      <div className="flex items-center gap-4 w-full lg:w-auto z-10">
        <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-plum-100 to-plum-50 flex items-center justify-center text-plum-800 font-black shadow-inner border border-plum-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
          {apt.patients?.avatar_url ? <img src={apt.patients.avatar_url} className="w-full h-full object-cover" /> : apt.patients?.name?.[0] || 'P'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-black text-gray-900 text-base lg:text-xl truncate tracking-tight">{apt.patients?.name || `Patient-${idx + 1}`}</p>
            {apt.consultation_type === 'telemedicine' && (
              <div className="p-1 px-2 bg-teal-50 rounded-lg flex items-center gap-1 shrink-0">
                <Video size={10} className="text-teal-600" />
                <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest hidden xs:block">Video</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Clock size={12} className="text-plum-400" /> {apt.appointment_time}
            </div>
            <div className="hidden lg:block w-1 h-1 bg-gray-300 rounded-full" />
            <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Video size={12} className="text-gray-400" /> {apt.consultation_type || 'In-Person'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t border-gray-50 lg:border-t-0 pt-3 lg:pt-0 z-10">
        <span className="hidden sm:inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100 shadow-sm">Confirmed</span>
        <button className="flex-1 lg:flex-none px-4 py-2.5 bg-white text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">Details</button>
        <button
          onClick={onStart}
          className="flex-1 lg:flex-none px-6 lg:px-10 py-2.5 lg:py-3 bg-plum-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-plum-800/30 group-hover:shadow-plum-800/40 relative overflow-hidden"
        >
          <span className="relative z-10">Start Session</span>
          <div className="absolute inset-0 bg-gradient-to-r from-plum-600 to-plum-800 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
}

function RequestCard({ req, idx, onView, onConfirm }) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between p-4 bg-white rounded-3xl border border-amber-100 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/5 transition-all gap-4">
      <div className="flex items-center gap-4 w-full lg:w-auto">
        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 font-black shadow-inner border border-amber-100 shrink-0">
          {req.patients?.name?.[0] || 'P'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-base lg:text-lg truncate">{req.patients?.name || `Patient-${idx + 1}`}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase tracking-widest">
              <Clock size={12} /> Requested: {req.appointment_time || 'Next Slot'}
            </div>
            {req.consultation_type === 'telemedicine' && (
              <>
                <div className="hidden lg:block w-1 h-1 bg-amber-200 rounded-full" />
                <div className="flex items-center gap-1 text-[10px] font-black text-teal-600 uppercase tracking-widest">
                  <Video size={12} /> Video
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t border-amber-100/50 lg:border-t-0 pt-3 lg:pt-0">
        <span className="hidden sm:inline-block px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 mr-2">New</span>
        <button onClick={onView} className="px-4 lg:px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">Decline</button>
        <button onClick={onConfirm} className="flex-1 lg:flex-none px-6 lg:px-8 py-2.5 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20">Confirm</button>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, gradient, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-plum-500 hover:shadow-2xl hover:shadow-plum-500/10 transition-all group text-left relative overflow-hidden cursor-pointer"
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-gradient-to-br ${gradient} group-hover:text-white transition-all duration-500`}>
          {icon}
        </div>
        <span className="font-black text-[11px] uppercase tracking-widest text-gray-900">{label}</span>
      </div>
      <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-2 transition-transform text-gray-300 group-hover:text-plum-600 relative z-10" />
      {/* Subtle hover background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-plum-500/0 to-plum-500/0 group-hover:from-plum-500/5 group-hover:to-transparent transition-all duration-500" />
    </motion.button>
  );
}

function PatientDetailModal({ patient, onClose, onConfirm, isConfirmation }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-plum-800 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
          <h3 className="text-2xl font-black uppercase tracking-tight">Patient Information</h3>
          <p className="opacity-60 font-bold text-sm">Review details carefully</p>
        </div>
        <div className="p-8 space-y-4 bg-gray-50/50">
          <ModalItem label="Patient name" value={patient.name} />
          <ModalItem label="Age" value={patient.age || '45 years'} />
          <ModalItem label="Phone" value={patient.phone} />
          <ModalItem label="Address" value={patient.address || '456 Patient Street, Healthcare City'} />
          <ModalItem label="Payment Status" value="Paid" color="emerald" />
        </div>
        <div className="p-8 pt-2 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">
            Close
          </button>
          {isConfirmation && (
            <button onClick={onConfirm} className="flex-1 py-4 bg-plum-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-plum-800/20">
              Confirm Appointment
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalItem({ label, value, color }) {
  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-black ${color === 'emerald' ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}

// Full implementation of the detailed Consultation Modal
function ConsultationModal({ patient, appointmentId, isTelemedicine, onClose }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('consultation');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [isDetailsConfirmed, setIsDetailsConfirmed] = useState(false);
  const [medications, setMedications] = useState([
    { name: '', dosage: '500mg', frequency: 'OD (Once daily)', duration: '7 days', instructions: 'After food' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '500mg', frequency: 'OD (Once daily)', duration: '7 days', instructions: 'After food' }]);
  };

  const updateMedication = (index, field, value) => {
    const newMedications = [...medications];
    newMedications[index][field] = value;
    setMedications(newMedications);
  };

  const handleSharePrescription = async () => {
    if (!diagnosis) return toast.error('Please enter a diagnosis');
    if (medications.some(m => !m.name)) return toast.error('Please fill in all medication names');

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: doctorData } = await supabase.from('doctors').select('id').eq('user_id', userData.user.id).single();

      const prescriptionData = {
        patient_id: patient.id,
        doctor_id: doctorData.id,
        appointment_id: appointmentId,
        diagnosis,
        medications,
        notes,
        created_at: new Date().toISOString()
      };

      const { data: insertedData, error } = await supabase.from('prescriptions').insert([prescriptionData]).select();

      if (error) throw error;

      // Mark appointment as completed
      if (appointmentId) {
        const { error: updateError } = await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);
        if (updateError) console.error('Appointment Update Error:', updateError);
      }

      toast.success('Prescription shared and session completed! 🎉');
      onClose();
    } catch (error) {
      console.error('Error saving prescription:', error);
      const msg = error?.message || error?.details || 'Unknown error occurred';
      toast.error(`Failed to save prescription: ${msg}`);
    } finally {
    }
  };

  const handleCompleteOnly = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);
      if (error) throw error;
      toast.success('Session marked as completed! ✅');
      onClose();
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-0 md:p-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white/95 backdrop-blur-xl w-full h-full max-w-7xl md:h-[90vh] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
      >
        {/* Modal Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-plum-800 rounded-2xl flex items-center justify-center text-white font-black text-xl">
              {patient.name?.[0] || 'P'}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">Patient Consultation</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{patient.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Sidebar: Patient Summary */}
          <aside className="hidden md:block w-80 bg-white border-r border-gray-100 p-8 overflow-y-auto space-y-8">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Patient Details</h3>
              <div className="space-y-4">
                <PatientSummaryItem icon={<User size={14} />} label="Age" value={patient.age || "45 years"} />
                <PatientSummaryItem icon={<Clock size={14} />} label="Phone" value={patient.phone} />
                <PatientSummaryItem icon={<MapPin size={14} />} label="Address" value={patient.address || "456 Patient St"} />
                <div className="flex justify-between items-center py-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Paid</span>
                </div>
                <PatientSummaryItem icon={<Calendar size={14} />} label="Date" value={mounted ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Loading Date...'} />
                <PatientSummaryItem icon={<Video size={14} />} label="Type" value={isTelemedicine ? "Telemedicine" : "In-Person"} />
              </div>

              {isTelemedicine && (
                <button
                  onClick={() => router.push(`/doctor/telemedicine/room?id=${appointmentId}`)}
                  className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95"
                >
                  <Video size={16} /> Join Video Call
                </button>
              )}

              <button
                onClick={() => setIsDetailsConfirmed(!isDetailsConfirmed)}
                className={`w-full mt-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${isDetailsConfirmed
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-teal-600/10 text-teal-700 border-teal-200 hover:bg-teal-600 hover:text-white'
                  }`}
              >
                {isDetailsConfirmed ? <><Check size={14} /> Details Confirmed</> : 'Confirm Details'}
              </button>
            </div>

            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-4">Patient Profile</h3>
              <p className="text-[10px] font-bold text-gray-400 leading-relaxed">Verification of patient identity and medical clearance is mandatory before proceeding with prescription sharing.</p>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col bg-[#F8FAFB] overflow-hidden">
            {/* Tab Navigation */}
            <div className="px-4 md:px-8 pt-6 md:pt-8 shrink-0">
              <div className="bg-gray-100 p-1.5 rounded-[1.5rem] flex flex-wrap md:flex-nowrap gap-1.5 border border-gray-200/50 shadow-inner">
                <TabButton
                  active={activeTab === 'consultation'}
                  onClick={() => setActiveTab('consultation')}
                  label="Consultation"
                />
                <TabButton
                  active={activeTab === 'prescription'}
                  onClick={() => setActiveTab('prescription')}
                  label="Prescription"
                />
                <TabButton
                  active={activeTab === 'history'}
                  onClick={() => setActiveTab('history')}
                  label="History"
                />
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8 pt-6">
              {activeTab === 'consultation' && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Diagnosis</h4>
                    <textarea
                      className="w-full h-64 bg-gray-50/50 rounded-2xl p-6 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-plum-500/20 text-gray-700 font-medium placeholder:text-gray-300 transition-all resize-none"
                      placeholder="Enter diagnosis details..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                    ></textarea>
                  </div>
                </motion.div>
              )}

              {activeTab === 'prescription' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Write Prescription</h4>
                      <button
                        onClick={addMedication}
                        className="p-2 bg-plum-50 text-plum-600 rounded-lg hover:bg-plum-100 transition-all"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {medications.map((med, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                          <div className="md:col-span-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Medication</label>
                            <input
                              type="text"
                              placeholder="Metformin 500mg"
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20 transition-all"
                              value={med.name}
                              onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Dosage</label>
                            <input
                              type="text"
                              placeholder="500mg"
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20 transition-all"
                              value={med.dosage}
                              onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Frequency</label>
                            <select
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20 transition-all cursor-pointer"
                              value={med.frequency}
                              onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                            >
                              <option>OD (Once daily)</option>
                              <option>BD (Twice daily)</option>
                              <option>TDS (Three times daily)</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Duration</label>
                            <input
                              type="text"
                              placeholder="7 days"
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20 transition-all"
                              value={med.duration}
                              onChange={(e) => updateMedication(idx, 'duration', e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Timing</label>
                            <select
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20 transition-all cursor-pointer"
                              value={med.instructions}
                              onChange={(e) => updateMedication(idx, 'instructions', e.target.value)}
                            >
                              <option>After food</option>
                              <option>Before food</option>
                              <option>With food</option>
                            </select>
                          </div>
                          <div className="md:col-span-1">
                            {medications.length > 1 && (
                              <button
                                onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                                className="p-3 text-gray-300 hover:text-rose-500 transition-colors"
                              >
                                <X size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Additional Instructions</label>
                      <textarea
                        className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-plum-500/20 transition-all resize-none"
                        placeholder="Other instructions..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <div className="py-20 text-center opacity-40">
                  <Clock size={48} className="mx-auto mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No previous history available</p>
                </div>
              )}
            </div>

            <div className="bg-white p-8 border-t border-gray-100 flex flex-wrap gap-4 items-center">
              <button
                onClick={handleCompleteOnly}
                disabled={isSaving}
                className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest ml-auto hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Complete Without Prescription
              </button>
              <button
                onClick={handleSharePrescription}
                disabled={isSaving}
                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSaving ? 'Sharing...' : <><Share2 size={14} /> Share Prescription</>}
              </button>
            </div>
          </main>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Modal Components
function PatientSummaryItem({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-slate-700">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}:</span>
      </div>
      <span className="text-xs font-black text-gray-900">{value}</span>
    </div>
  );
}


function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[100px] py-4 rounded-[1.25rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 ${active ? 'bg-white text-plum-800 shadow-lg shadow-plum-500/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/30'}`}
    >
      {label}
    </button>
  )
}
