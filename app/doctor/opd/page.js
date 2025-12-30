'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getDoctor, getDoctorAppointments, createAppointment } from '@/lib/supabase';
import { Calendar, Clock, Plus, Search, Filter, User, Phone, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OpdPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newAppointment, setNewAppointment] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    appointment_date: new Date().toLocaleDateString('en-CA'),
    appointment_time: '',
    consultation_type: 'in-person',
    reason: ''
  });

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilterStatus(statusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadOpdData();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, filterStatus]);

  const loadOpdData = async () => {
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
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patients?.phone?.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    setFilteredAppointments(filtered);
  };

  const handleAddAppointment = async () => {
    try {
      // In a real app, you'd create/find the patient first
      // For now, we'll show a toast that this needs patient integration
      toast.error('Please use the patient booking system to create appointments');
      setShowAddForm(false);
    } catch (error) {
      toast.error('Error creating appointment: ' + error.message);
    }
  };

  const getTodayAppointments = () => {
    const today = new Date().toLocaleDateString('en-CA');
    return appointments.filter(apt => apt.appointment_date === today);
  };

  if (!doctor) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
      <p className="text-gray-600">Loading...</p>
    </div>
  );

  const todayAppointments = getTodayAppointments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-indigo-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/doctor/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">OPD Management</h1>
              <p className="text-sm text-gray-600">Manage your outpatient appointments</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-3xl font-bold text-gray-900">{todayAppointments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900">
                  {appointments.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Appointments</p>
                <p className="text-3xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Add Appointment Form */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule New Appointment</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Patient Name"
                value={newAppointment.patient_name}
                onChange={(e) => setNewAppointment({ ...newAppointment, patient_name: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newAppointment.patient_phone}
                onChange={(e) => setNewAppointment({ ...newAppointment, patient_phone: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newAppointment.patient_email}
                onChange={(e) => setNewAppointment({ ...newAppointment, patient_email: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="date"
                value={newAppointment.appointment_date}
                onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="time"
                value={newAppointment.appointment_time}
                onChange={(e) => setNewAppointment({ ...newAppointment, appointment_time: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newAppointment.consultation_type}
                onChange={(e) => setNewAppointment({ ...newAppointment, consultation_type: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="in-person">In-Person</option>
                <option value="telemedicine">Telemedicine</option>
              </select>
              <textarea
                placeholder="Reason for visit"
                value={newAppointment.reason}
                onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
                className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                rows="3"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddAppointment}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Schedule Appointment
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Appointments List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h2>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-5 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                        {appointment.patients?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{appointment.patients?.name || 'Patient'}</h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {appointment.appointment_date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {appointment.appointment_time}
                          </div>
                          {appointment.patients?.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {appointment.patients.phone}
                            </div>
                          )}
                        </div>
                        {appointment.reason && (
                          <p className="text-sm text-gray-700 mt-2">
                            <span className="font-semibold">Reason:</span> {appointment.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {appointment.status}
                      </span>
                      <span className="text-xs text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                        {appointment.consultation_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
