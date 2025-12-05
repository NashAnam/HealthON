'use client';
import { Calendar, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AppointmentsSection({ appointments }) {
    const router = useRouter();

    if (!appointments || appointments.length === 0) return null;

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Calendar className="w-6 h-6" /></div>
                    <h3 className="font-bold text-xl text-slate-900">My Appointments</h3>
                </div>
                <button onClick={() => router.push('/patient/doctor-booking')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
            </div>
            <div className="space-y-4">
                {appointments.slice(0, 3).map((appt) => (
                    <div key={appt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                                {appt.doctors?.name?.charAt(0) || 'D'}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">Dr. {appt.doctors?.name || 'Doctor'}</p>
                                <p className="text-xs text-slate-500">{appt.appointment_date} • {appt.appointment_time}</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : appt.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {appt.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function LabBookingsSection({ labBookings }) {
    const router = useRouter();

    if (!labBookings || labBookings.length === 0) return null;

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600"><FileText className="w-6 h-6" /></div>
                    <h3 className="font-bold text-xl text-slate-900">My Lab Tests</h3>
                </div>
                <button onClick={() => router.push('/patient/lab')} className="text-sm font-bold text-violet-600 hover:text-violet-700">View All</button>
            </div>
            <div className="space-y-4">
                {labBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white font-bold">
                                {booking.labs?.name?.charAt(0) || 'L'}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{booking.labs?.name || 'Lab'}</p>
                                <p className="text-xs text-slate-500">{booking.test_type} • {booking.test_date}</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>
                            {booking.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
