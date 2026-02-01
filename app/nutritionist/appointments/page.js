'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getNutritionist, getNutritionistAppointments, updateAppointmentStatus } from '@/lib/supabase';
import { Calendar, Clock, User, ArrowLeft, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NutritionistAppointmentsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientFilter = searchParams.get('patient');

    const [nutritionist, setNutritionist] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) {
                router.push('/expert-login');
                return;
            }

            const { data: nutriData } = await getNutritionist(user.id);
            if (!nutriData) {
                router.push('/complete-profile');
                return;
            }
            setNutritionist(nutriData);

            const { data: apptsData } = await getNutritionistAppointments(nutriData.id);

            let filtered = apptsData || [];
            if (patientFilter) {
                filtered = filtered.filter(a => a.patient_id === patientFilter);
            }

            setAppointments(filtered);
        } catch (error) {
            console.error('Error loading appointments:', error);
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        try {
            const { error } = await updateAppointmentStatus(appointmentId, newStatus);
            if (error) throw error;

            toast.success(`Appointment ${newStatus}`);
            loadData(); // Reload list
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredAppointments = appointments.filter(appt => {
        if (filter === 'all') return true;
        return appt.status === filter;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/nutritionist/dashboard')}
                            className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Appointments</h1>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Consultation Schedule</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {['all', 'pending', 'completed', 'cancelled'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                                        : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {filteredAppointments.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Appointments</h3>
                        <p className="text-gray-500 font-medium">Your schedule is currently clear.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAppointments.map((appt) => (
                            <div
                                key={appt.id}
                                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex flex-col items-center justify-center border border-gray-100">
                                        <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">
                                            {new Date(appt.appointment_date).toLocaleString('default', { month: 'short' })}
                                        </span>
                                        <span className="text-2xl font-black text-gray-900 leading-none">
                                            {new Date(appt.appointment_date).getDate()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                                            {appt.patients?.name || 'Unknown Patient'}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                <span>{appt.appointment_time}</span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${appt.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                                                    appt.status === 'completed' ? 'bg-green-50 text-green-600' :
                                                        'bg-red-50 text-red-600'
                                                }`}>
                                                {appt.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {appt.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(appt.id, 'completed')}
                                                className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-green-600/10 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Complete
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(appt.id, 'cancelled')}
                                                className="flex-1 md:flex-none px-6 py-3 bg-white text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => router.push(`/nutritionist/diet-plans?patient=${appt.patient_id}`)}
                                        className="flex-1 md:flex-none px-6 py-3 bg-gray-50 text-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                                    >
                                        Prescribe Diet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
