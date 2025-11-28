'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, updatePatient, supabase } from '@/lib/supabase';
import { ShieldCheck, ArrowRight, CheckCircle2, FileText, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConsentPage() {
    const router = useRouter();
    const [patient, setPatient] = useState(null);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPatient();
    }, []);

    const loadPatient = async () => {
        console.log('[CONSENT] Loading patient...');
        const user = await getCurrentUser();
        if (!user) {
            console.log('[CONSENT] No user found, redirecting to login');
            router.replace('/login');
            return;
        }

        console.log('[CONSENT] User found:', user.id);

        // Try to get patient with retry logic
        let patientData = null;
        for (let i = 0; i < 3; i++) {
            console.log(`[CONSENT] Attempt ${i + 1} to fetch patient`);
            const { data } = await getPatient(user.id);
            if (data) {
                patientData = data;
                console.log('[CONSENT] Patient found:', patientData);
                break;
            }
            if (i < 2) {
                console.log('[CONSENT] Patient not found, waiting 500ms before retry...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        if (!patientData) {
            console.log('[CONSENT] Patient not found after retries, redirecting to complete-profile');
            router.replace('/complete-profile');
            return;
        }

        if (patientData.consent_given) {
            console.log('[CONSENT] Consent already given, redirecting to payment');
            router.replace('/patient/payment');
            return;
        }

        console.log('[CONSENT] Setting patient data');
        setPatient(patientData);

        // Check payment status
        const { data: payment } = await supabase
            .from('payments')
            .select('payment_status')
            .eq('patient_id', patientData.id)
            .maybeSingle();

        if (payment && (payment.payment_status === 'completed' || payment.payment_status === 'pending_verification')) {
            console.log('[CONSENT] Payment already active, redirecting to dashboard');
            router.replace('/patient/dashboard');
        }
    };

    const handleSubmitConsent = async () => {
        if (!agreed) {
            toast.error('Please agree to continue');
            return;
        }

        setLoading(true);
        try {
            const { error } = await updatePatient(patient.user_id, {
                consent_given: true
            });

            if (error) throw error;

            toast.success('Consent recorded');
            router.push('/patient/payment');
        } catch (error) {
            toast.error('Error saving consent');
            setLoading(false);
        }
    };

    if (!patient) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-indigo-100">
            <div className="max-w-3xl w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 p-8 flex items-center gap-4 border-b border-slate-100">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Privacy & Consent</h1>
                        <p className="text-slate-500 text-sm mt-1">Please review our terms to continue.</p>
                    </div>
                </div>

                <div className="p-8 md:p-10">
                    <div className="flex items-start gap-4 p-5 bg-indigo-50 rounded-2xl border border-indigo-100 mb-8">
                        <AlertCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <p className="text-indigo-900 text-sm leading-relaxed">
                            Your privacy is our priority. We need your explicit consent to securely process your health data in accordance with HIPAA and GDPR standards.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-8 h-80 overflow-y-auto space-y-6">
                        <section>
                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-3">
                                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                </div>
                                1. Data Collection
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed pl-10">
                                We collect health information including personal metrics, medical history, appointment records, and lab results to provide comprehensive care.
                            </p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-3">
                                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                </div>
                                2. Usage
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed pl-10">
                                Your data is used to generate personalized health insights, facilitate doctor communication, track progress, and improve our services.
                            </p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-3">
                                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                                    <Lock className="w-4 h-4 text-indigo-600" />
                                </div>
                                3. Security
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed pl-10">
                                We employ end-to-end encryption, secure cloud storage, and strict access controls. Your data is protected by industry-standard security protocols.
                            </p>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50 transition-all cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-slate-300 transition-all checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-400"
                                />
                                <CheckCircle2 className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    I accept the Terms of Service
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    I consent to the collection and processing of my health data.
                                </p>
                            </div>
                        </label>

                        <button
                            onClick={handleSubmitConsent}
                            disabled={!agreed || loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Continue to Payment
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
