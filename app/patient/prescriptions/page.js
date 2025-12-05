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
            router.push('/complete-profile');
            return;
        }
        setPatient(patientData);

        // Fetch prescriptions
        const { data: prescriptionsData, error } = await supabase
            .from('prescriptions')
            .select('*, doctors(*)')
            .eq('patient_id', patientData.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching prescriptions:', error);
            toast.error('Failed to load prescriptions');
        } else {
            setPrescriptions(prescriptionsData || []);
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-indigo-100">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/patient/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
                            <p className="text-sm text-gray-600">View all your medical prescriptions</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {prescriptions.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No prescriptions yet</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {prescriptions.map((prescription) => (
                            <div key={prescription.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-5 h-5 text-indigo-600" />
                                            <h3 className="text-lg font-bold text-gray-900">
                                                Dr. {prescription.doctors?.name || 'Doctor'}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(prescription.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Diagnosis */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2">Diagnosis</h4>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{prescription.diagnosis}</p>
                                </div>

                                {/* Medications */}
                                {prescription.medications && prescription.medications.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <Pill className="w-4 h-4 text-indigo-600" />
                                            Medications
                                        </h4>
                                        <div className="space-y-3">
                                            {prescription.medications.map((med, index) => (
                                                <div key={index} className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h5 className="font-bold text-gray-900">{med.name}</h5>
                                                        <span className="text-sm font-semibold text-indigo-600">{med.dosage}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                                        <div>
                                                            <span className="font-semibold">Frequency:</span> {med.frequency}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold">Duration:</span> {med.duration}
                                                        </div>
                                                        {med.instructions && (
                                                            <div className="col-span-2">
                                                                <span className="font-semibold">Instructions:</span> {med.instructions}
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
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-violet-600" />
                                            <span className="font-semibold text-gray-700">Follow-up:</span>
                                            <span className="text-gray-900">
                                                {new Date(prescription.follow_up_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {prescription.notes && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-700 mb-2">Additional Notes</h4>
                                        <p className="text-gray-600 text-sm">{prescription.notes}</p>
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
