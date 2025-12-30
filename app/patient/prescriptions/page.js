'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { FileText, ArrowLeft, Calendar, User, Pill, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrescriptionsPage() {
    const router = useRouter();
    const [patient, setPatient] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const user = await getCurrentUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: patientData } = await getPatient(user.id);
        if (!patientData) {
            setLoading(false);
            return;
        }
        setPatient(patientData);

        console.log('🔍 DEBUG - Loading prescriptions for patient:', {
            patient_id: patientData.id,
            patient_name: patientData.name,
            user_id: user.id
        });

        // Fetch prescriptions
        const { data: prescriptionsData, error } = await supabase
            .from('prescriptions')
            .select('*, doctors(*)')
            .eq('patient_id', patientData.id)
            .order('created_at', { ascending: false });

        console.log('📋 DEBUG - Prescriptions query result:', {
            count: prescriptionsData?.length || 0,
            data: prescriptionsData,
            error: error
        });

        if (error) {
            console.error('❌ Error fetching prescriptions:', error);
            toast.error('Failed to load prescriptions');
        } else {
            setPrescriptions(prescriptionsData || []);
            console.log('✅ Prescriptions loaded:', prescriptionsData?.length || 0);
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plum-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/patient/dashboard')}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
                            <p className="text-sm text-gray-500">Track your medications & doctor notes</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {prescriptions.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No prescriptions found</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {prescriptions.map((prescription) => (
                            <div key={prescription.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all group">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-50">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-plum-50 flex items-center justify-center text-plum-700">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                Dr. {prescription.doctors?.name || 'Doctor'}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 ml-12">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(prescription.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-lg text-xs font-bold">
                                        Active
                                    </div>
                                </div>

                                {/* Diagnosis */}
                                <div className="mb-6 pl-2 border-l-4 border-plum-500 ml-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Diagnosis</h4>
                                    <p className="text-lg font-bold text-gray-900">{prescription.diagnosis}</p>
                                </div>

                                {/* Medications */}
                                {prescription.medications && prescription.medications.length > 0 && (
                                    <div className="mb-6 bg-gray-50 rounded-2xl p-4">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <Pill className="w-4 h-4 text-plum-600" />
                                            Prescribed Medications
                                        </h4>
                                        <div className="space-y-3">
                                            {prescription.medications.map((med, index) => (
                                                <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h5 className="font-bold text-gray-900">{med.name}</h5>
                                                        <span className="text-xs font-bold text-white bg-plum-600 px-2 py-1 rounded-lg">{med.dosage}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                                                        <div className="bg-gray-50 px-2 py-1 rounded">
                                                            <span className="font-bold text-gray-400">Freq:</span> {med.frequency}
                                                        </div>
                                                        <div className="bg-gray-50 px-2 py-1 rounded">
                                                            <span className="font-bold text-gray-400">Dur:</span> {med.duration}
                                                        </div>
                                                        {med.instructions && (
                                                            <div className="col-span-2 bg-yellow-50 text-yellow-800 px-2 py-1 rounded mt-1 border border-yellow-100">
                                                                Note: {med.instructions}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Follow-up */}
                                {prescription.follow_up_date && (
                                    <div className="mb-0 flex items-center gap-2 text-sm bg-teal-50 p-3 rounded-xl border border-teal-100 text-teal-800">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-bold">Next Follow-up:</span>
                                        <span>
                                            {new Date(prescription.follow_up_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}

                                {/* Notes */}
                                {prescription.notes && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Doctor's Notes</h4>
                                        <p className="text-gray-600 text-sm italic">"{prescription.notes}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
