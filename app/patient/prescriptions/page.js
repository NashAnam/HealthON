'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, Calendar, ArrowLeft, AlertCircle } from 'lucide-react';
import { getCurrentUser, getPatient, supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function PrescriptionsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);

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
                // No profile, redirect to login
                localStorage.setItem('redirect_after_login', window.location.pathname);
                router.push('/login');
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

        } catch (error) {
            console.error('Load error:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
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
        <div className="min-h-screen bg-[#f5f5f5] p-8">
            {/* Back Button */}
            <button
                onClick={() => router.push('/patient/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
            </button>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">My Prescriptions</h2>



            {/* Active Prescriptions */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Active Prescriptions</h3>
            </div>

            {/* Prescriptions List */}
            <div className="space-y-4">
                {prescriptions.length > 0 ? (
                    prescriptions.map((prescription) => (
                        <div key={prescription.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#4a2b3d]">
                                        <Pill className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-1">{prescription.diagnosis || 'Prescription'}</h4>
                                        <p className="text-sm text-gray-600">
                                            Prescribed by {prescription.doctors?.name?.toLowerCase().startsWith('dr') ? prescription.doctors.name : `Dr. ${prescription.doctors?.name || 'Doctor'}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-[#5a8a7a] text-white px-4 py-1 rounded-full text-sm font-semibold">
                                    Active
                                </div>
                            </div>

                            {prescription.medications && prescription.medications.length > 0 ? (
                                <div className="space-y-3 mb-4">
                                    {prescription.medications.map((med, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-xl">
                                            <h5 className="font-bold text-gray-900 mb-2">{med.name}</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Dosage</p>
                                                    <p className="text-sm font-bold text-gray-900">{med.dosage}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Frequency</p>
                                                    <p className="text-sm font-bold text-gray-900">{med.frequency}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Duration</p>
                                                    <p className="text-sm font-bold text-gray-900">{med.duration}</p>
                                                </div>
                                            </div>
                                            {med.instructions && (
                                                <p className="text-sm text-gray-600 mt-2">
                                                    <span className="font-semibold">Instructions:</span> {med.instructions}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : prescription.medication_name && (
                                <div className="space-y-3 mb-4">
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <h5 className="font-bold text-gray-900 mb-2">{prescription.medication_name}</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Dosage</p>
                                                <p className="text-sm font-bold text-gray-900">{prescription.dosage}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Frequency</p>
                                                <p className="text-sm font-bold text-gray-900">{prescription.frequency}</p>
                                            </div>
                                        </div>
                                        {prescription.instructions && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                <span className="font-semibold">Instructions:</span> {prescription.instructions}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {prescription.notes && (
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Doctor's Notes</p>
                                    <p className="text-sm text-gray-700 italic">"{prescription.notes}"</p>
                                </div>
                            )}

                            {prescription.follow_up_date && (
                                <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Follow-up: {prescription.follow_up_date ? new Date(prescription.follow_up_date).toLocaleDateString('en-US') : 'N/A'}</span>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                        <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No prescriptions found</p>
                        <p className="text-sm text-gray-400 mt-2">Your prescriptions will appear here once prescribed by a doctor</p>
                    </div>
                )}
            </div>
        </div>
    );
}
