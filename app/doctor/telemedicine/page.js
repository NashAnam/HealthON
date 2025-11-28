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
        const telemedicineAppts = (appointmentsData || []).filter(apt => apt.consultation_type === 'telemedicine');

        const today = new Date().toISOString().split('T')[0];
        const upcoming = telemedicineAppts.filter(apt => apt.appointment_date >= today && apt.status !== 'completed');
        const past = telemedicineAppts.filter(apt => apt.appointment_date < today || apt.status === 'completed');

        setAppointments(telemedicineAppts);
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
    };

    const handleStartConsultation = (appointment) => {
        toast.success('Video consultation feature coming soon!');
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
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Video className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Sessions</p>
                                <p className="text-3xl font-bold text-gray-900">{appointments.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Upcoming</p>
                                <p className="text-3xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-3xl font-bold text-gray-900">{pastAppointments.length}</p>
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
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
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
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleStartConsultation(appointment)}
                                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                                            >
                                                <Video className="w-4 h-4" />
                                                Start Call
                                            </button>
                                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold text-center ${appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
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
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-xl">
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
                                                </div>
                                                {appointment.reason && (
                                                    <p className="text-sm text-gray-700 mt-2">
                                                        <span className="font-semibold">Reason:</span> {appointment.reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
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
