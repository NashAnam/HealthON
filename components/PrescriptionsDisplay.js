'use client';
import { useRouter } from 'next/navigation';
import { FileText, User, Calendar, ChevronRight, Plus } from 'lucide-react';

export function PrescriptionsSection({ prescriptions }) {
    const router = useRouter();

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-xl text-slate-900">My Prescriptions</h3>
                </div>
                {prescriptions && prescriptions.length > 0 && (
                    <button
                        onClick={() => router.push('/patient/prescriptions')}
                        className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                    >
                        View All
                    </button>
                )}
            </div>

            {!prescriptions || prescriptions.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">No Prescriptions Yet</h4>
                    <p className="text-sm text-slate-500 mb-4">Your prescriptions from doctors will appear here</p>
                    <p className="text-xs text-slate-400">Book an appointment to get started!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {prescriptions.slice(0, 3).map((prescription) => (
                        <div
                            key={prescription.id}
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => router.push('/patient/prescriptions')}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Dr. {prescription.doctors?.name || 'Doctor'}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(prescription.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="pl-13">
                                <p className="text-sm text-slate-700 font-semibold mb-1">Diagnosis:</p>
                                <p className="text-sm text-slate-600 line-clamp-2">{prescription.diagnosis}</p>
                                {prescription.medications && prescription.medications.length > 0 && (
                                    <p className="text-xs text-emerald-600 font-bold mt-2">
                                        {prescription.medications.length} medication{prescription.medications.length > 1 ? 's' : ''} prescribed
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
