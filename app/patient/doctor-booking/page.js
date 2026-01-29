'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser, getPatient, getVerifiedDoctors, createAppointment, getLatestAssessment } from '@/lib/supabase';
import { Stethoscope, Search, Calendar, Clock, Star, MapPin, ArrowLeft, Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSidebar } from '@/lib/SidebarContext';
import { MoreVertical } from 'lucide-react';
import { scheduleAppointmentReminder, requestNotificationPermission } from '@/lib/notifications';

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
    appointment_type: 'Consultation',
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

      const [patientData, doctorsData] = await Promise.all([
        getPatient(user.id).then(res => res.data),
        getVerifiedDoctors().then(res => res.data)
      ]);

      if (patientData) {
        setPatient(patientData);
        const { data: assessmentData } = await getLatestAssessment(patientData.id);
        if (assessmentData && assessmentData.scores) {
          const reccs = [];
          const s = assessmentData.scores;
          if (s.diabetes > 30) reccs.push('Diabetologist', 'Endocrinologist');
          if (s.hypertension > 4) reccs.push('Cardiologist');
          if (s.cvd > 5) reccs.push('Cardiologist');
          if (s.dyslipidemia > 5) reccs.push('Endocrinologist', 'Cardiologist');
          if (s.thyroid > 5) reccs.push('Endocrinologist');

          setRecommendations([...new Set(reccs)]);
        }
      }

      setDoctors(doctorsData || []);
      setFilteredDoctors(doctorsData || []);

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

  const formatDays = (days) => {
    if (!days) return 'Contact for availability';

    let daysArray = [];
    if (Array.isArray(days)) {
      daysArray = days;
    } else if (typeof days === 'string') {
      // Handle "MonTueWed" or "Mon, Tue, Wed"
      if (days.includes(',')) {
        daysArray = days.split(',').map(d => d.trim());
      } else {
        const matches = days.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)/gi);
        daysArray = matches || days.replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
      }
    }

    // Standardize to full names and deduplicate
    const dayMap = {
      'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday', 'thu': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday',
      'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday', 'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
    };

    const uniqueDays = [...new Set(daysArray
      .map(d => d.toLowerCase().substring(0, 3))
      .map(d => dayMap[d] || d)
      .filter(Boolean)
    )];

    return uniqueDays.join(', ');
  };

  const parseDaysToArray = (days) => {
    if (!days) return [];
    if (Array.isArray(days)) return days.map(d => d.toLowerCase().trim());

    // Normalize to handle mixed formats like "mon, Tuesday, Fri"
    const cleanStr = days.toLowerCase()
      .replace(/thurs/g, 'thursday')
      .replace(/thu/g, 'thursday')
      .replace(/tues/g, 'tuesday')
      .replace(/tue/g, 'tuesday')
      .replace(/mon/g, 'monday')
      .replace(/wed/g, 'wednesday')
      .replace(/fri/g, 'friday')
      .replace(/sat/g, 'saturday')
      .replace(/sun/g, 'sunday');

    const matches = cleanStr.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/g);
    return matches ? [...new Set(matches)] : [];
  };

  const parseTimeToMinutes = (tStr) => {
    if (!tStr) return 0;
    try {
      const parts = tStr.toUpperCase().trim().match(/(\d+):?(\d+)?\s*(AM|PM)?/);
      if (!parts) return 0;

      let hours = parseInt(parts[1]);
      let minutes = parts[2] ? parseInt(parts[2]) : 0;
      const modifier = parts[3];

      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      return hours * 60 + minutes;
    } catch (e) {
      console.error('Time parsing error:', e);
      return 0;
    }
  };

  const handleBookAppointment = async () => {
    if (!bookingData.appointment_date || !bookingData.appointment_time || !bookingData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!patient) {
      toast.error('Patient profile not found. Please complete your profile first.');
      return;
    }

    // Validate doctor availability
    if (selectedDoctor.available_days && selectedDoctor.timings) {
      const selectedDate = new Date(bookingData.appointment_date);
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Check if doctor is available on selected day
      // Use the new robust parser
      const availableDays = parseDaysToArray(selectedDoctor.available_days);

      const selectedDayShort = dayOfWeek.toLowerCase();

      const isAvailable = availableDays.some(d => selectedDayShort.includes(d));

      if (!isAvailable) {
        toast.error(`Dr. ${selectedDoctor.name} is not available on ${dayOfWeek}. Available: ${availableDays.join(', ')}`);
        return;
      }

      // Check if time is within doctor's timings
      // Handle "10am-5pm" or "10:00-17:00" formats loosely if needed, 
      // but assuming standard HH:MM - HH:MM or similar from database for now.
      // If timings are just a string description, we might skip strict validation or just warn.
      if (selectedDoctor.timings && selectedDoctor.timings.includes('-')) {
        // Simple string check for now 
        // Re-implementing strict check might be complex without standardizing DB format
        // For now, let's rely on user reading the displayed timings which we will add to the modal
      }
    }

    try {
      const { data: appointment, error: bookingError } = await createAppointment({
        patient_id: patient.id,
        doctor_id: selectedDoctor.id,
        appointment_date: bookingData.appointment_date,
        appointment_time: bookingData.appointment_time,
        consultation_type: bookingData.consultation_type,
        reason: bookingData.reason,
        status: 'pending'
      });

      if (bookingError) throw bookingError;

      // Schedule push notification
      const hasPermission = await requestNotificationPermission();
      if (hasPermission && appointment) {
        await scheduleAppointmentReminder({
          ...appointment,
          doctors: selectedDoctor
        });
      }

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
                className="p-2 -ml-2 text-[#4a2b3d] hover:bg-gray-50 rounded-xl transition-colors"
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
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-[#4a2b3d] transition-colors">
                      {doctor.name?.toLowerCase().startsWith('dr') ? doctor.name : `Dr. ${doctor.name}`}
                    </h3>
                    <p className="text-[#5a8a7a] font-medium text-sm mb-1">{doctor.specialty || doctor.qualification || 'General Physician'}</p>
                    {doctor.verified && (
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs text-gray-500 font-medium">Verified Profile</span>
                      </div>
                    )}
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
                {doctor.available_days && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-xs">
                        {formatDays(doctor.available_days)}
                      </p>
                      <p className="text-xs text-gray-400">Available Days</p>
                    </div>
                  </div>
                )}
                {doctor.timings && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-500">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-xs">{doctor.timings}</p>
                      <p className="text-xs text-gray-400">Timings</p>
                    </div>
                  </div>
                )}

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
                <p className="text-sm text-gray-500">{selectedDoctor.name?.toLowerCase().startsWith('dr') ? selectedDoctor.name : `Dr. ${selectedDoctor.name}`} • {selectedDoctor.specialty}</p>

                {/* Show Availability Here */}
                <div className="mt-4 flex gap-4">
                  <div className="bg-purple-50 px-3 py-2 rounded-xl border border-purple-100 flex-1">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Days</p>
                    <p className="text-xs font-bold text-purple-900">
                      {formatDays(selectedDoctor.available_days)}
                    </p>
                  </div>
                  <div className="bg-teal-50 px-3 py-2 rounded-xl border border-teal-100 flex-1">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Time</p>
                    <p className="text-xs font-bold text-teal-900">{selectedDoctor.timings || 'Contact for timings'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  {/* Smart Date Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Date</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(() => {
                        // Helper to get next available dates
                        const getNextAvailableDates = () => {
                          const dates = [];
                          const today = new Date();
                          let daysFound = 0;
                          let dayOffset = 0;

                          // Use robust parsing
                          const validDays = parseDaysToArray(selectedDoctor.available_days);

                          while (daysFound < 6) { // Show next 6 valid slots
                            const d = new Date(today);
                            d.setDate(today.getDate() + dayOffset);
                            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

                            // Simple case-insensitive check
                            const isAvailable = validDays.some(vd => dayName.includes(vd));

                            if (isAvailable) {
                              dates.push(d);
                              daysFound++;
                            }
                            dayOffset++;
                            // Safety break
                            if (dayOffset > 30) break;
                          }
                          return dates;
                        };

                        const availableDates = getNextAvailableDates();

                        return availableDates.map((date) => {
                          const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
                          const isSelected = bookingData.appointment_date === dateStr;
                          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                          const dayNum = date.getDate();
                          const month = date.toLocaleDateString('en-US', { month: 'short' });

                          return (
                            <button
                              key={dateStr}
                              onClick={() => setBookingData({ ...bookingData, appointment_date: dateStr })}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${isSelected
                                ? 'border-[#4a2b3d] bg-[#4a2b3d] text-white shadow-lg shadow-[#4a2b3d]/20 scale-[1.02]'
                                : 'border-slate-100 bg-white text-slate-600 hover:border-[#4a2b3d]/30 hover:bg-slate-50'
                                }`}
                            >
                              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{dayName}</span>
                              <span className="text-lg font-black">{dayNum}</span>
                              <span className="text-[10px] font-bold opacity-80">{month}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Time Slot Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Time</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {(() => {
                        // Generate times based on doctor timings (e.g. "6PM - 9PM")
                        let timeSlots = [];
                        let startTime = 9; // Default 9 AM
                        let endTime = 17;  // Default 5 PM

                        if (selectedDoctor.timings) {
                          const parts = selectedDoctor.timings.split('-').map(t => t.trim());
                          if (parts.length === 2) {
                            startTime = parseTimeToMinutes(parts[0]) / 60;
                            endTime = parseTimeToMinutes(parts[1]) / 60;
                          }
                        }

                        // Generate 30 min slots
                        for (let t = startTime * 60; t < endTime * 60; t += 30) {
                          const h = Math.floor(t / 60);
                          const m = t % 60;

                          const date = new Date();
                          date.setHours(h);
                          date.setMinutes(m);

                          const timeValue = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                          const timeDisplay = date.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          });

                          timeSlots.push({ value: timeValue, label: timeDisplay });
                        }

                        return timeSlots.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => setBookingData({ ...bookingData, appointment_time: slot.value })}
                            className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${bookingData.appointment_time === slot.value
                              ? 'bg-[#5a8a7a] text-white border-[#5a8a7a]'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-[#5a8a7a]'
                              }`}
                          >
                            {slot.label}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Visit Type</label>
                    <select
                      value={bookingData.appointment_type}
                      onChange={(e) => setBookingData({ ...bookingData, appointment_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4a2b3d]/20 focus:border-[#4a2b3d] outline-none text-sm font-medium bg-white"
                    >
                      <option value="Consultation">Consultation</option>
                      <option value="Regular Checkup">Regular Checkup</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Second Opinion">Second Opinion</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Consultation Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingData({ ...bookingData, consultation_type: 'in-person' })}
                        className={`px-2 py-3 rounded-xl border-2 font-bold text-[10px] uppercase transition-all ${bookingData.consultation_type === 'in-person' ? 'border-[#4a2b3d] bg-[#4a2b3d]/5 text-[#4a2b3d]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      >
                        In-Person
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingData({ ...bookingData, consultation_type: 'telemedicine' })}
                        className={`px-2 py-3 rounded-xl border-2 font-bold text-[10px] uppercase transition-all ${bookingData.consultation_type === 'telemedicine' ? 'border-[#5a8a7a] bg-[#5a8a7a]/5 text-[#5a8a7a]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      >
                        Video Call
                      </button>
                    </div>
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