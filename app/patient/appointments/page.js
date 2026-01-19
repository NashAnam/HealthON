'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, ArrowLeft, AlertCircle, Video, X, MapPin, User, Stethoscope, FileText, Info } from 'lucide-react';
import { getCurrentUser, getPatient, getAppointments, supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useSidebar } from '@/lib/SidebarContext';
import { MoreVertical } from 'lucide-react';

export default function AppointmentsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const { toggle } = useSidebar();
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
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

            // Fetch appointments and lab bookings
            const [apptsRes, labsRes] = await Promise.all([
                getAppointments(patientData.id),
                supabase.from('lab_bookings').select('*, labs(name, address)').eq('patient_id', patientData.id).order('test_date', { ascending: false })
            ]);

            const allBookings = [
                ...(apptsRes.data || []).map(a => ({ ...a, type: 'doctor' })),
                ...(labsRes.data || []).map(l => ({
                    ...l,
                    type: 'lab',
                    appointment_type: l.test_type,
                    appointment_date: l.test_date,
                    appointment_time: '9:00 AM - 5:00 PM',
                    doctors: {
                        name: l.labs?.name || 'Lab',
                        specialty: 'Diagnostic Lab',
                        address: l.labs?.address
                    }
                }))
            ].sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

            setAppointments(allBookings);

        } catch (error) {
            console.error('Load error:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleRescheduleClick = (apt) => {
        setSelectedAppointment(apt);
        setIsRescheduling(true);
        setRescheduleData({
            date: apt.appointment_date ? apt.appointment_date.split('T')[0] : '', // Format date for input type="date"
            time: apt.appointment_time || ''
        });
    };

    const confirmReschedule = async () => {
        if (!selectedAppointment) return;

        const tid = toast.loading('Updating appointment...');
        try {
            const { error } = await supabase
                .from('appointments')
                .update({
                    appointment_date: rescheduleData.date,
                    appointment_time: rescheduleData.time,
                    status: 'pending' // Revert to pending for doctor approval? Or keep confirmed? Usually reschedule requires re-confirmation. Let's keep status as is or 'pending'. User didn't specify. Safe bet is pending or just update fields. Let's just update fields for now, or maybe set to 'pending' if it was confirmed. Let's assume 'pending' is safer for logic if doctor needs to approve.
                    // Actually, for this demo, let's keep it simple and just change the date.
                })
                .eq('id', selectedAppointment.id);

            if (error) throw error;

            toast.success('Rescheduled successfully!', { id: tid });
            setSelectedAppointment(null);
            setIsRescheduling(false);
            loadData();
        } catch (error) {
            toast.error('Failed to reschedule', { id: tid });
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
                <div className="w-12 h-12 border-4 border-[#5a8a7a] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDF8FA] pb-20">
            {/* Header */}
            <header className="bg-white px-6 md:px-12 py-5 border-b border-gray-100 sticky top-0 z-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggle}
                        className="lg:hidden p-2 -ml-2 text-[#4a2b3d] hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <MoreVertical className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => router.push('/patient/dashboard')}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-1">Schedule</h1>
                        <p className="text-lg md:text-2xl font-black text-[#4a2b3d] uppercase tracking-tight">My Appointments</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-12">
                {/* Book New Button */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-50">
                    <div className="flex-1 w-full relative">
                        <input
                            type="text"
                            placeholder="Search appointments..."
                            className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a2b3d]/10 transition-all"
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={() => router.push('/patient/doctor-booking')}
                            className="flex-1 md:flex-none bg-[#4a2b3d] text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.1em] text-[10px] shadow-lg shadow-[#4a2b3d]/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            + Book New Appointment
                        </button>
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <section>
                    <h3 className="text-base font-black text-[#4a2b3d] uppercase tracking-[0.05em] mb-8 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#5a8a7a] rounded-full" />
                        Upcoming Appointments
                    </h3>
                    <div className="space-y-6">
                        {appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length > 0 ? (
                            appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 hover:shadow-xl hover:border-[#5a8a7a]/20 transition-all group flex flex-col lg:flex-row gap-8 lg:items-center justify-between"
                                >
                                    {/* Left: Details */}
                                    <div className="flex-1 flex gap-6 items-start">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 ${appointment.type === 'doctor' ? 'bg-[#4a2b3d]/5 text-[#4a2b3d]' : 'bg-[#5a8a7a]/5 text-[#5a8a7a]'}`}>
                                            {appointment.type === 'doctor' ? <Calendar className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-xl md:text-2xl font-black text-[#4a2b3d] tracking-tight">{appointment.appointment_type || 'Annual Checkup'}</h4>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <User className="w-4 h-4" />
                                                    <p className="text-sm font-bold">
                                                        {appointment.type === 'doctor'
                                                            ? (appointment.doctors?.name?.toLowerCase().startsWith('dr') ? appointment.doctors.name : `Dr. ${appointment.doctors?.name || 'Ganesh Johnson'}`)
                                                            : (appointment.doctors?.name || 'Lab')} • {appointment.doctors?.specialty || 'Primary Care'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Clock className="w-4 h-4" />
                                                    <p className="text-sm font-bold">
                                                        {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Jan 15, 2026'} at {appointment.appointment_time || '10:00 AM'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <MapPin className="w-4 h-4" />
                                                    <p className="text-sm font-medium">{appointment.doctors?.address || 'Main Medical Center, Room 302'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="lg:w-48 flex flex-col gap-3 min-w-[180px]">
                                        <div className={`self-end px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${appointment.status === 'confirmed' ? 'bg-[#5a8a7a]/10 text-[#5a8a7a]' :
                                            appointment.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                'bg-gray-100 text-gray-400'
                                            }`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${appointment.status === 'confirmed' ? 'bg-[#5a8a7a] animate-pulse' : 'bg-current'}`} />
                                                {appointment.status || 'Scheduled'}
                                            </div>
                                        </div>

                                        {appointment.type === 'doctor' && appointment.status === 'confirmed' && appointment.consultation_type === 'telemedicine' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/patient/telemedicine/room?id=${appointment.id}`);
                                                }}
                                                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Video size={16} /> Join Appointment
                                            </button>
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRescheduleClick(appointment);
                                            }}
                                            className="w-full py-4 bg-[#4a2b3d] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-[#3a1b2d] active:scale-95"
                                        >
                                            Reschedule
                                        </button>
                                        <button
                                            className="w-full py-4 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-rose-50 active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-[3rem] p-16 text-center border border-gray-50 shadow-sm">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Calendar className="w-10 h-10 text-gray-200" />
                                </div>
                                <h4 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Appointments Found</h4>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Your schedule is currently empty</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Past Appointments */}
                <section>
                    <h3 className="text-base font-black text-gray-400 uppercase tracking-[0.05em] mb-8 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-gray-200 rounded-full" />
                        Past Appointments
                    </h3>
                    <div className="space-y-4">
                        {appointments.filter(a => a.status === 'completed').length > 0 ? (
                            appointments.filter(a => a.status === 'completed').map((appointment) => (
                                <div key={appointment.id} className="bg-white rounded-[2rem] p-6 border border-gray-50 shadow-sm flex flex-col md:flex-row items-center justify-between opacity-90 hover:opacity-100 transition-opacity">
                                    <div className="flex-1 flex items-center gap-6">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                                            <Calendar className="w-7 h-7" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-black text-[#4a2b3d] tracking-tight">{appointment.appointment_type || 'Follow-up Visit'}</h4>
                                            <p className="text-xs font-bold text-gray-400">
                                                {appointment.type === 'doctor'
                                                    ? (appointment.doctors?.name?.toLowerCase().startsWith('dr') ? appointment.doctors.name : `Dr. ${appointment.doctors?.name || 'Sarah Johnson'}`)
                                                    : (appointment.doctors?.name || 'Lab')} • {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date N/A'} at {appointment.appointment_time || 'Time N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-6 md:mt-0">
                                        <div className="px-4 py-1.5 bg-gray-100 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-gray-400" />
                                            Completed
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedAppointment(appointment);
                                                setIsRescheduling(false);
                                            }}
                                            className="px-8 py-3 bg-gray-50 text-gray-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-100 active:scale-95 transition-all border border-gray-200"
                                        >
                                            View Notes
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/50 rounded-[2rem] p-10 text-center border border-dashed border-gray-200">
                                <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px]">No historical records found</p>
                            </div>
                        )}
                    </div>
                </section>

            </main>

            {/* Appointment Details Modal */}
            {selectedAppointment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => { setSelectedAppointment(null); setIsRescheduling(false); }}
                    />
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-gray-50 flex items-start justify-between bg-gradient-to-br from-white to-gray-50/50">
                            <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${selectedAppointment.type === 'doctor' ? 'bg-[#4a2b3d]/10 text-[#4a2b3d]' : 'bg-[#5a8a7a]/10 text-[#5a8a7a]'}`}>
                                    {selectedAppointment.type === 'doctor' ? <Stethoscope className="w-8 h-8" /> : <Info className="w-8 h-8" />}
                                </div>
                                <div className="pr-8">
                                    <h3 className="text-2xl font-black text-[#4a2b3d] uppercase tracking-tight leading-tight mb-1">
                                        {isRescheduling ? 'Reschedule' : (selectedAppointment.appointment_type || 'Consultation')}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        {isRescheduling ? 'Select New Slot' : `${selectedAppointment.status || 'Pending'} Appointment`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedAppointment(null); setIsRescheduling(false); }}
                                className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto space-y-8 max-h-[70vh]">
                            {/* Doctor/Lab Info */}
                            {!isRescheduling && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-[#5a8a7a] uppercase tracking-[0.2em]">Provider Details</p>
                                    <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-slate-900 leading-tight">
                                                {selectedAppointment.type === 'doctor'
                                                    ? (selectedAppointment.doctors?.name?.toLowerCase().startsWith('dr') ? selectedAppointment.doctors.name : `Dr. ${selectedAppointment.doctors?.name}`)
                                                    : selectedAppointment.doctors?.name}
                                            </p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                                {selectedAppointment.doctors?.specialty || 'Medical Specialist'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reason */}
                            {!isRescheduling && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-[#5a8a7a] uppercase tracking-[0.2em]">Reason for Visit</p>
                                    <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
                                        <p className="text-slate-700 font-bold leading-relaxed">
                                            {selectedAppointment.reason || 'No specific reason provided.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Location & Type */}
                            {!isRescheduling && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-[#5a8a7a] uppercase tracking-[0.2em]">Location</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs font-black text-slate-800 uppercase leading-snug">
                                                {selectedAppointment.type === 'doctor' ? (selectedAppointment.doctors?.address || 'Main Clinic') : (selectedAppointment.doctors?.address || 'Lab Facility')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-[#5a8a7a] uppercase tracking-[0.2em]">Mode</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                                {selectedAppointment.consultation_type === 'telemedicine' ? <Video className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                            </div>
                                            <p className="text-xs font-black text-slate-800 uppercase leading-snug">
                                                {selectedAppointment.consultation_type === 'telemedicine' ? 'Virtual Consultation' : 'In-Person Visit'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Schedule */}
                            <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Scheduled Date</p>
                                        {isRescheduling ? (
                                            <input
                                                type="date"
                                                className="w-full mt-2 p-3 rounded-xl border border-gray-200 font-bold text-slate-700"
                                                value={rescheduleData.date}
                                                onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                            />
                                        ) : (
                                            <p className="text-base font-black text-slate-900 leading-none mt-1">
                                                {selectedAppointment.appointment_date ? new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Time Slot</p>
                                        {isRescheduling ? (
                                            <input
                                                type="time"
                                                className="w-full mt-2 p-3 rounded-xl border border-gray-200 font-bold text-slate-700"
                                                value={rescheduleData.time}
                                                onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                                            />
                                        ) : (
                                            <p className="text-base font-black text-[#5a8a7a] leading-none mt-1">
                                                {selectedAppointment.appointment_time || '10:00 AM'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                            {!isRescheduling ? (
                                <>
                                    {selectedAppointment.status === 'confirmed' && selectedAppointment.consultation_type === 'telemedicine' && (
                                        <button
                                            onClick={() => router.push(`/patient/telemedicine/room?id=${selectedAppointment.id}`)}
                                            className="flex-1 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            <Video size={18} /> Join Video Call
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setSelectedAppointment(null); setIsRescheduling(false); }}
                                        className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50 active:scale-95"
                                    >
                                        Close Details
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={confirmReschedule}
                                        className="flex-1 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-teal-600/20 active:scale-95"
                                    >
                                        Confirm Reschedule
                                    </button>
                                    <button
                                        onClick={() => setIsRescheduling(false)}
                                        className="flex-1 py-4 bg-white border-2 border-rose-200 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-rose-50 active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
