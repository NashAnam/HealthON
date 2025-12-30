'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getPatientAppointments, supabase } from '@/lib/supabase';
import { Calendar, Clock, MapPin, User, Check, X, AlertCircle, Video } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return router.push('/login');

            const { data: patientData, error: pError } = await getPatient(user.id);
            if (pError) console.error('Patient fetch error:', pError);
            if (!patientData) {
                console.warn('No patient data found for user:', user.id);
                return;
            }

            console.log('Loading appointments for patient:', patientData.id);
            const { data, error } = await getPatientAppointments(patientData.id);

            if (error) {
                console.error('Appointments fetch error details:', error);
                throw error;
            }
            console.log('Appointments loaded:', data?.length || 0);
            setAppointments(data || []);
        } catch (error) {
            console.error('Detailed error loading appointments:', error);
            toast.error(error?.message || 'Failed to load appointments.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Appointment cancelled');
            loadAppointments();
        } catch (error) {
            toast.error('Error cancelling appointment');
        }
    };

    const handleRebook = (doctor) => {
        router.push(`/patient/doctor-booking?doctor=${doctor.id}`);
    };

    const handleConfirm = async (id) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'confirmed' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Appointment confirmed!');
            loadAppointments();
        } catch (error) {
            toast.error('Error confirming appointment');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plum-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface font-sans text-slate-900 pb-20">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
                <div className="container mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                    <p className="text-sm text-gray-500">Manage your scheduled visits</p>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {appointments.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No appointments found.</p>
                        <button
                            onClick={() => router.push('/patient/doctor-booking')}
                            className="mt-4 px-6 py-3 bg-plum-700 text-white rounded-xl font-bold hover:bg-plum-800 transition-all"
                        >
                            Book New Appointment
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">

                                <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-teal-50 rounded-2xl text-teal-700 border border-teal-100">
                                    <span className="text-xs font-bold uppercase">{new Date(apt.appointment_date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-2xl font-bold">{new Date(apt.appointment_date).getDate()}</span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Dr. {apt.doctors?.name || 'Unknown'}</h3>
                                            <p className="text-sm text-teal-600 font-medium">{apt.doctors?.specialty || 'General Physician'}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                            }`}>
                                            {apt.status || 'Pending'}
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>{apt.appointment_time || 'Not specified'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>{apt.consultation_type === 'telemedicine' ? 'Video Call' : 'In-Person'}</span>
                                        </div>
                                        {apt.doctors?.address && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 md:col-span-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span>{apt.doctors.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    {apt.reason && (
                                        <div className="bg-gray-50 rounded-xl p-3 mb-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Reason for Visit</p>
                                            <p className="text-sm text-gray-700">{apt.reason}</p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => {
                                                if (apt.consultation_type === 'telemedicine') {
                                                    router.push(`/patient/telemedicine/room?id=${apt.id}`);
                                                } else {
                                                    toast.info('In-person visit details are available at the clinic.');
                                                }
                                            }}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                                        >
                                            View Details
                                        </button>

                                        {apt.consultation_type === 'telemedicine' && apt.status === 'confirmed' && (
                                            <button
                                                onClick={() => router.push(`/patient/telemedicine/room?id=${apt.id}`)}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                                            >
                                                <Video className="w-4 h-4" />
                                                Join Video Call
                                            </button>
                                        )}

                                        {apt.status === 'pending' && (
                                            <button
                                                onClick={() => handleConfirm(apt.id)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" />
                                                Confirm
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleRebook(apt.doctors)}
                                            className="px-4 py-2 bg-plum-600 text-white rounded-xl text-sm font-bold hover:bg-plum-700 transition-all"
                                        >
                                            Book Another
                                        </button>

                                        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                            <button
                                                onClick={() => handleCancel(apt.id)}
                                                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => router.push('/patient/doctor-booking')}
                                className="px-8 py-4 bg-plum-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-plum-800 transition-all shadow-lg shadow-plum-700/20"
                            >
                                + Book New Appointment
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
