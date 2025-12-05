'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getVerifiedDoctors, createAppointment } from '@/lib/supabase';
import { Stethoscope, Search, Calendar, Clock, Star, MapPin, ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { notifyAppointmentBooked } from '@/lib/appointmentNotifications';

export default function DoctorBookingPage() {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
    consultation_type: 'in-person',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, selectedSpecialization]);

  const loadData = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: patientData } = await getPatient(user.id);
    if (!patientData) {
      router.push('/complete-profile');
      return;
    }
    setPatient(patientData);

    const { data: doctorsData } = await getVerifiedDoctors();
    setDoctors(doctorsData || []);
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter(doc => doc.specialization === selectedSpecialization);
    }

    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = async () => {
    if (!bookingData.appointment_time || !bookingData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createAppointment({
        patient_id: patient.id,
        doctor_id: selectedDoctor.id,
        ...bookingData,
        status: 'pending'
      });

      // Send notification
      notifyAppointmentBooked({
        ...bookingData,
        status: 'pending'
      }, selectedDoctor);

      toast.success('Appointment booked successfully!');
      setShowBookingForm(false);
      setSelectedDoctor(null);
      router.push('/patient/dashboard');
    } catch (error) {
      toast.error('Error booking appointment: ' + error.message);
    }
  };

  const specializations = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  if (!patient) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <p className="text-gray-600">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/patient/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book Doctor Appointment</h1>
              <p className="text-sm text-gray-600">Find and book appointments with verified doctors</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
              <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No doctors found</p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {doctor.name?.charAt(0) || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">Dr. {doctor.name}</h3>
                    <p className="text-sm text-gray-600">{doctor.specialization || 'General Physician'}</p>
                    {doctor.verified && (
                      <div className="flex items-center gap-1 mt-1">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600 font-semibold">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {doctor.qualification && (
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Qualification:</span> {doctor.qualification}
                  </p>
                )}

                {doctor.experience && (
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Experience:</span> {doctor.experience}
                  </p>
                )}

                {doctor.clinic_address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{doctor.clinic_address}</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setShowBookingForm(true);
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Book Appointment
                </button>
              </div>
            ))
          )}
        </div>

        {/* Booking Modal */}
        {showBookingForm && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowBookingForm(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
                <p className="text-gray-600">Dr. {selectedDoctor.name} - {selectedDoctor.specialization}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Appointment Date</label>
                  <input
                    type="date"
                    value={bookingData.appointment_date}
                    onChange={(e) => setBookingData({ ...bookingData, appointment_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Appointment Time</label>
                  <input
                    type="time"
                    value={bookingData.appointment_time}
                    onChange={(e) => setBookingData({ ...bookingData, appointment_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Consultation Type</label>
                  <select
                    value={bookingData.consultation_type}
                    onChange={(e) => setBookingData({ ...bookingData, consultation_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  >
                    <option value="in-person">In-Person</option>
                    <option value="telemedicine">Telemedicine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Visit</label>
                  <textarea
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                    placeholder="Describe your symptoms or reason for consultation..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                    rows="4"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleBookAppointment}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                  >
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => {
                      setShowBookingForm(false);
                      setSelectedDoctor(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}