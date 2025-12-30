'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getDoctor, getDoctorAppointments } from '@/lib/supabase';
import { Video, Calendar, Clock, User, FileText, ArrowLeft, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TelemedicinePage() {
    const router = useRouter();
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [pastAppointments, setPastAppointments] = useState([]);

    useEffect(() => {
        loadTelemedicineData();
    }, []);

    const loadTelemedicineData = async () => {
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

        // Relaxed filter to catch all telemedicine-related appointments
        const telemedicineAppts = (appointmentsData || []).filter(apt => {
            const type = apt.consultation_type?.toLowerCase() || '';
            return type === 'telemedicine' || type === 'video' || type === 'virtual';
        });

        const today = new Date().toLocaleDateString('en-CA');

        // Upcoming: Today's or future appointments that are not completed or cancelled
        const upcoming = telemedicineAppts.filter(apt =>
            apt.appointment_date >= today &&
            apt.status !== 'completed' &&
            apt.status !== 'cancelled'
        );

        // Past: Previous dates or completed/cancelled ones
        const past = telemedicineAppts.filter(apt =>
            apt.appointment_date < today ||
            apt.status === 'completed' ||
            apt.status === 'cancelled'
        );

        setAppointments(telemedicineAppts);
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
    };

    const handleStartConsultation = (appointment) => {
        if (!appointment.id) {
            toast.error("Invalid appointment ID");
            return;
        }
        router.push(`/doctor/telemedicine/room?id=${appointment.id}`);
    };

    if (!doctor) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
            <p className="text-gray-600">Loading...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-purple-100">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/doctor/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Telemedicine</h1>
                            <p className="text-sm text-gray-600">Virtual consultations and remote care</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-purple-500/5 border border-white/50 group hover:bg-white transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                                <Video className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Total Sessions</p>
                                <p className="text-4xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-left">{appointments.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-white/50 group hover:bg-white transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Calendar className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Upcoming</p>
                                <p className="text-4xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-left">{upcomingAppointments.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-white/50 group hover:bg-white transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                <FileText className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Completed</p>
                                <p className="text-4xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-left">{pastAppointments.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Consultations */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Consultations</h2>
                    {upcomingAppointments.length === 0 ? (
                        <div className="text-center py-12">
                            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">No upcoming telemedicine appointments</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 hover:shadow-md transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                                                {appointment.patients?.name?.charAt(0) || 'P'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 truncate">{appointment.patients?.name || 'Patient'}</h3>
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <Calendar className="w-4 h-4 text-purple-600" />
                                                        {appointment.appointment_date}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <Clock className="w-4 h-4 text-indigo-600" />
                                                        {appointment.appointment_time}
                                                    </div>
                                                    {appointment.patients?.phone && (
                                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                            <Phone className="w-4 h-4 text-blue-600" />
                                                            {appointment.patients.phone}
                                                        </div>
                                                    )}
                                                </div>
                                                {appointment.reason && (
                                                    <p className="text-sm text-gray-700 mt-3 p-3 bg-white/50 rounded-lg border border-purple-100/50">
                                                        <span className="font-bold text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Reason for consultation</span>
                                                        {appointment.reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                                            <button
                                                onClick={() => handleStartConsultation(appointment)}
                                                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
                                            >
                                                <Video className="w-4 h-4" />
                                                <span className="whitespace-nowrap">Start Call</span>
                                            </button>
                                            <span className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center flex items-center justify-center ${appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {appointment.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Past Consultations */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Past Consultations</h2>
                    {pastAppointments.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">No past consultations</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pastAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="p-5 bg-gray-50 rounded-xl border border-gray-200"
                                >
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                                                {appointment.patients?.name?.charAt(0) || 'P'}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{appointment.patients?.name || 'Patient'}</h3>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 font-medium">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {appointment.appointment_date}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {appointment.appointment_time}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="w-full sm:w-auto px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 text-center">
                                            Completed
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="mt-8 bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-2xl border border-purple-200">
                    <div className="flex items-start gap-4">
                        <Video className="w-8 h-8 text-purple-600 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Telemedicine Guidelines</h3>
                            <ul className="space-y-1 text-sm text-gray-700">
                                <li>• Ensure stable internet connection before starting consultation</li>
                                <li>• Keep patient records accessible during the call</li>
                                <li>• Document consultation notes immediately after the session</li>
                                <li>• Follow up with digital prescriptions if needed</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
