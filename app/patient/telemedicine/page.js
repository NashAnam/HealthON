'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getAppointments } from '@/lib/supabase';
import { Video, Calendar, Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientTelemedicinePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return router.push('/login');

            const { data: patient } = await getPatient(user.id);
            if (!patient) return router.push('/complete-profile');

            const { data: appts } = await getAppointments(patient.id);

            // Filter for telemedicine only and exclude completed/cancelled
            const teleAppts = (appts || []).filter(a =>
                (a.consultation_type === 'telemedicine' || a.consultation_type === 'video') &&
                a.status !== 'cancelled' &&
                a.status !== 'completed'
            ).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

            setAppointments(teleAppts);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to load telemedicine sessions');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDF8FA] pb-20">
            <header className="bg-white px-6 py-5 border-b border-gray-100 sticky top-0 z-50 flex items-center gap-4">
                <button
                    onClick={() => router.push('/patient/dashboard')}
                    className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-[#4a2b3d] uppercase tracking-tight">Telemedicine</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Virtual Consultations</p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                {appointments.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
                            <Video size={32} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">No Scheduled Calls</h3>
                        <p className="text-sm text-gray-500 font-medium">You don't have any upcoming telemedicine sessions.</p>
                        <button
                            onClick={() => router.push('/patient/doctor-booking')}
                            className="mt-6 px-8 py-3 bg-[#4a2b3d] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                            Book Appointment
                        </button>
                    </div>
                ) : (
                    appointments.map(apt => (
                        <div key={apt.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-100 transition-colors">
                            <div className="flex items-center gap-5 flex-1 w-full">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Video size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">
                                        {apt.doctors?.name?.toLowerCase().startsWith('dr') ? apt.doctors.name : `Dr. ${apt.doctors?.name}`}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {apt.appointment_date}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {apt.appointment_time}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {apt.status === 'confirmed' ? (
                                <button
                                    onClick={() => router.push(`/patient/telemedicine/room?id=${apt.id}`)}
                                    className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Video size={16} /> Join Call
                                </button>
                            ) : (
                                <span className="px-6 py-3 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-amber-100">
                                    {apt.status}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
