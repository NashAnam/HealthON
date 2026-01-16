'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getVerifiedDoctors, createAppointment, getLatestAssessment } from '@/lib/supabase';
import { Stethoscope, Search, Calendar, Clock, Star, MapPin, ArrowLeft, Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSidebar } from '@/lib/SidebarContext';
import { MoreVertical } from 'lucide-react';

export default function DoctorBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [locationSearch, setLocationSearch] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingData, setBookingData] = useState({
    appointment_date: '',
    appointment_time: '',
    consultation_type: 'in-person',
    reason: ''
  });
  const [recommendations, setRecommendations] = useState([]);
  const { toggle } = useSidebar();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, selectedSpecialty, locationSearch]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return router.push('/login');

      const [patientData, doctorsData, assessmentData] = await Promise.all([
        getPatient(user.id).then(res => res.data),
        getVerifiedDoctors().then(res => res.data),
        getLatestAssessment(user.id).then(res => res.data)
      ]);

      console.log('Doctors fetched:', doctorsData?.length || 0, doctorsData);

      setPatient(patientData);

      let finalDoctors = doctorsData || [];
      if (finalDoctors.length === 0) {
        // Provide demo doctors if database is empty for testing/demo purposes
        finalDoctors = [
          {
            id: 'demo-1',
            name: 'Sarah Rahman',
            specialty: 'Cardiologist',
            qualification: 'MD, FACC',
            experience: '12',
            address: 'City Heart Center, Tower A',
            verified: true
          },
          {
            id: 'demo-2',
            name: 'Imran Ahmed',
            specialty: 'Endocrinologist',
            qualification: 'MD, DM',
            experience: '8',
            address: 'Diabetes Care Clinic, North Wing',
            verified: true
          }
        ];
      }

      setDoctors(finalDoctors);
      setFilteredDoctors(finalDoctors);

      if (assessmentData && assessmentData.scores) {
        const recs = [];
        const s = assessmentData.scores;
        if (s.diabetes > 30) recs.push('Diabetologist', 'Endocrinologist');
        if (s.hypertension > 4) recs.push('Cardiologist');
        if (s.cvd > 5) recs.push('Cardiologist');
        if (s.dyslipidemia > 5) recs.push('Endocrinologist', 'Cardiologist');
        if (s.thyroid > 5) recs.push('Endocrinologist');

        const uniqueRecs = [...new Set(recs)];
        setRecommendations(uniqueRecs);

        // Don't auto-select specialty to show all doctors initially
        // if (uniqueRecs.length > 0) {
        //   setSelectedSpecialty(uniqueRecs[0]);
        // }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.specialty || doc.qualification || doc.hospital)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationSearch) {
      filtered = filtered.filter(doc =>
        (doc.address || doc.location)?.toLowerCase().includes(locationSearch.toLowerCase())
      );
    }

    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(doc => (doc.specialty || doc.qualification || 'General Physician') === selectedSpecialty);
    }

    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = async () => {
    if (!bookingData.appointment_date || !bookingData.appointment_time || !bookingData.reason) {
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

      toast.success('Appointment booked successfully!');
      setShowBookingForm(false);
      setSelectedDoctor(null);
      setBookingData({ appointment_date: '', appointment_time: '', consultation_type: 'in-person', reason: '' });
      router.push('/patient/appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Error booking appointment: ' + error.message);
    }
  };

  const specializations = [...new Set(doctors.map(d => d.specialty || d.qualification || 'General Physician').filter(Boolean))];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8FA]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4a2b3d]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDF8FA] font-sans text-slate-900 pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <div className="container mx-auto px-6 md:px-12 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggle}
                className="lg:hidden p-2 -ml-2 text-[#4a2b3d] hover:bg-gray-50 rounded-xl transition-colors"
              >
                <MoreVertical className="w-6 h-6" />
              </button>
              <button
                onClick={() => router.push('/patient/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-[#4a2b3d] uppercase tracking-tight">Book Doctor</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Find top specialists</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 md:px-12 py-8 max-w-7xl">
        {recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-[#4a2b3d] to-[#5a8a7a] rounded-[2rem] p-6 mb-8 text-white shadow-xl shadow-[#4a2b3d]/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="text-amber-300" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">AI Recommendations</h2>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Based on assessment</p>
                </div>
              </div>
              <div className="flex gap-2">
                {recommendations.map(rec => (
                  <span key={rec} className="px-3 py-1.5 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20 whitespace-nowrap">
                    {rec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, speciality..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a2b3d]/20 focus:border-[#4a2b3d] transition-all"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Location (e.g. New York)"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a2b3d]/20 focus:border-[#4a2b3d] transition-all"
              />
            </div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a2b3d]/20 focus:border-[#4a2b3d] bg-white font-medium"
            >
              <option value="all">All Specializations</option>
              {recommendations.length > 0 && recommendations.map(spec => (
                <option key={`rec-${spec}`} value={spec}>✨ {spec} (Recommended)</option>
              ))}
              {specializations.filter(s => !recommendations.includes(s)).map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No doctors found matching your criteria</p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#4a2b3d]/10 transition-all group"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-[#4a2b3d] font-bold text-2xl flex-shrink-0 border border-gray-100">
                    {doctor.name?.charAt(0) || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-[#4a2b3d] transition-colors">Dr. {doctor.name}</h3>
                    <p className="text-[#5a8a7a] font-medium text-sm mb-1">{doctor.specialty || doctor.qualification || 'General Physician'}</p>
                    {doctor.verified && (
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs text-gray-500 font-medium">Verified Profile</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                      <Star size={16} fill="currentColor" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{doctor.experience || '5+'} Years</p>
                      <p className="text-xs text-gray-400">Experience</p>
                    </div>
                  </div>
                  {doctor.address && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                        <MapPin size={16} />
                      </div>
                      <span className="line-clamp-2 text-xs font-medium">{doctor.address}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setShowBookingForm(true);
                  }}
                  className="w-full bg-[#5a8a7a] text-white px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#4a7a6a] transition-all shadow-md active:scale-95"
                >
                  Book Appointment
                </button>
              </div>
            ))
          )}
        </div>

        {/* Booking Modal */}
        {showBookingForm && selectedDoctor && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowBookingForm(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
                <p className="text-sm text-gray-500">Dr. {selectedDoctor.name} • {selectedDoctor.specialty}</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Date</label>
                    <input
                      type="date"
                      value={bookingData.appointment_date}
                      onChange={(e) => setBookingData({ ...bookingData, appointment_date: e.target.value })}
                      min={new Date().toLocaleDateString('en-CA')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4a2b3d]/20 focus:border-[#4a2b3d] outline-none text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Time Slot</label>
                    <input
                      type="time"
                      value={bookingData.appointment_time}
                      onChange={(e) => setBookingData({ ...bookingData, appointment_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4a2b3d]/20 focus:border-[#4a2b3d] outline-none text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Consultation Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingData({ ...bookingData, consultation_type: 'in-person' })}
                      className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${bookingData.consultation_type === 'in-person' ? 'border-[#4a2b3d] bg-[#4a2b3d]/5 text-[#4a2b3d]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                    >
                      In-Person
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingData({ ...bookingData, consultation_type: 'telemedicine' })}
                      className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${bookingData.consultation_type === 'telemedicine' ? 'border-[#5a8a7a] bg-[#5a8a7a]/5 text-[#5a8a7a]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                    >
                      Video Call
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Reason for Visit</label>
                  <textarea
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                    placeholder="Describe your symptoms..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4a2b3d]/20 focus:border-[#4a2b3d] outline-none text-sm"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowBookingForm(false);
                      setSelectedDoctor(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookAppointment}
                    className="flex-1 bg-[#4a2b3d] text-white px-6 py-3.5 rounded-xl font-bold hover:bg-[#3a1b2d] transition-colors shadow-lg shadow-[#4a2b3d]/20"
                  >
                    Confirm Booking
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