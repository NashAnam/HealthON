'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getDoctor, getDoctorAppointments } from '@/lib/supabase';
import { Calendar, Users, Video, Activity, Clock, TrendingUp, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    totalPatients: 0,
    pending: 0
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: doctorData } = await getDoctor(user.id);
    if (!doctorData) {
      router.push('/complete-profile');
      return;
    }
    setDoctor(doctorData);

    const { data: appointmentsData } = await getDoctorAppointments(doctorData.id);
    setAppointments(appointmentsData || []);

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = (appointmentsData || []).filter(a => a.appointment_date === today);
    const pending = (appointmentsData || []).filter(a => a.status === 'pending');

    setStats({
      today: todayAppts.length,
      thisWeek: (appointmentsData || []).length,
      totalPatients: new Set((appointmentsData || []).map(a => a.patient_id)).size,
      pending: pending.length
    });
  };

  const handleLogout = async () => {
    router.push('/login');
    toast.success('Logged out successfully');
  };

  if (!doctor) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="text-center">
        <Activity className="w-12 h-12 text-indigo-600 animate-pulse mx-auto mb-4" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-indigo-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CareOn</h1>
                <p className="text-sm text-gray-600">Doctor Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">Dr. {doctor.name || 'Doctor'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Navigation */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <button className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg whitespace-nowrap">
            Dashboard
          </button>
          <button
            onClick={() => router.push('/doctor/opd')}
            className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold hover:shadow-md transition-all whitespace-nowrap border border-gray-200"
          >
            OPD
          </button>
          <button
            onClick={() => router.push('/doctor/patients')}
            className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold hover:shadow-md transition-all whitespace-nowrap border border-gray-200"
          >
            Patients
          </button>
          <button
            onClick={() => router.push('/doctor/telemedicine')}
            className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold hover:shadow-md transition-all whitespace-nowrap border border-gray-200"
          >
            Telemedicine
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-indigo-600">Today</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.today}</p>
            <p className="text-sm text-gray-600 mt-1">Appointments</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-600">Pending</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-sm text-gray-600 mt-1">To Review</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-600">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
            <p className="text-sm text-gray-600 mt-1">Patients</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-emerald-600">This Week</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.thisWeek}</p>
            <p className="text-sm text-gray-600 mt-1">Appointments</p>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Appointments</h2>
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No appointments yet</p>
              <button
                onClick={() => router.push('/doctor/opd')}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Manage OPD
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.slice(0, 5).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      {appointment.patients?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{appointment.patients?.name || 'Patient'}</p>
                      <p className="text-sm text-gray-600">{appointment.appointment_date} • {appointment.appointment_time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {appointment.status}
                    </span>
                    {appointment.consultation_type === 'telemedicine' && (
                      <Video className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <button
            onClick={() => router.push('/doctor/opd')}
            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 text-left group"
          >
            <Calendar className="w-10 h-10 text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Manage OPD</h3>
            <p className="text-sm text-gray-600">View and manage today's appointments</p>
          </button>

          <button
            onClick={() => router.push('/doctor/patients')}
            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 text-left group"
          >
            <Users className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Patient Records</h3>
            <p className="text-sm text-gray-600">Access patient history and records</p>
          </button>

          <button
            onClick={() => router.push('/doctor/telemedicine')}
            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 text-left group"
          >
            <Video className="w-10 h-10 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Telemedicine</h3>
            <p className="text-sm text-gray-600">Virtual consultations and follow-ups</p>
          </button>
        </div>
      </div>
    </div>
  );
}