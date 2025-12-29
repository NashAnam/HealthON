'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getDoctor, getDoctorAppointments, signOut } from '@/lib/supabase';
import { Calendar, Users, Video, Activity, Clock, TrendingUp, LogOut, CheckCircle, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, totalPatients: 0, pending: 0 });

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    const user = await getCurrentUser();
    if (!user) return router.push('/login');
    const { data: doctorData } = await getDoctor(user.id);
    if (!doctorData) return router.push('/complete-profile');
    setDoctor(doctorData);

    const { data: appointmentsData } = await getDoctorAppointments(doctorData.id);
    setAppointments(appointmentsData || []);

    const today = new Date().toISOString().split('T')[0];
    setStats({
      today: (appointmentsData || []).filter(a => a.appointment_date === today).length,
      thisWeek: (appointmentsData || []).length, // Simplified logic
      totalPatients: new Set((appointmentsData || []).map(a => a.patient_id)).size,
      pending: (appointmentsData || []).filter(a => a.status === 'pending').length
    });
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!doctor) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plum-600"></div></div>;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 fixed top-0 w-full z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-plum-900 to-teal-700">HealthOn Doctor</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-700">Dr. {doctor.name}</span>
            <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-lg transition-colors"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-28 pb-10">

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <StatCard icon={Calendar} label="Today's Appointments" value={stats.today} color="plum" />
          <StatCard icon={Clock} label="Pending Requests" value={stats.pending} color="teal" />
          <StatCard icon={Users} label="Total Patients" value={stats.totalPatients} color="indigo" />
          <StatCard icon={TrendingUp} label="Total Visits" value={stats.thisWeek} color="gray" />
        </div>

        {/* Appointments Section */}
        <div className="bg-white/60 backdrop-blur-lg rounded-3xl border border-white/40 shadow-xl overflow-hidden p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            Today's Appointments <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{stats.today} Active</span>
          </h2>

          <div className="space-y-4">
            {appointments.filter(a => a.status !== 'completed').map((appt) => (
              <div key={appt.id} className="group flex flex-col md:flex-row items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                    {appt.patients?.name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{appt.patients?.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Clock size={14} /> {appt.appointment_time}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600 uppercase">{appt.consultation_type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
                  {appt.status === 'pending' ? (
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20">
                      <CheckCircle size={18} /> Confirm
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/doctor/consultation/${appt.id}`)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-plum-700 text-white font-semibold rounded-xl hover:bg-plum-800 transition-colors shadow-lg shadow-plum-700/20"
                    >
                      <Play size={18} /> Start Consultation
                    </button>
                  )}
                </div>
              </div>
            ))}
            {appointments.length === 0 && <p className="text-center text-gray-500 py-10">No appointments scheduled for today.</p>}
          </div>
        </div>

      </main>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    plum: 'bg-plum-50 text-plum-700',
    teal: 'bg-teal-50 text-teal-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    gray: 'bg-gray-50 text-gray-700',
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={24} /></div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}