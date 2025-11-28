'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, createPayment, updatePatient, supabase } from '@/lib/supabase';
import { ShieldCheck, CheckCircle2, QrCode, ArrowRight, Activity, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [patient, setPatient] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    const [showTransactionInput, setShowTransactionInput] = useState(false);

    useEffect(() => {
        loadPatient();
    }, []);

    const loadPatient = async () => {
        const user = await getCurrentUser();
        if (!user) {
            router.replace('/login');
            return;
        }
        const { data } = await getPatient(user.id);
        if (data) {
            setPatient(data);
            // Check if already paid
            const { data: payment } = await supabase
                .from('payments')
                .select('payment_status')
                .eq('patient_id', data.id)
                .maybeSingle();

            if (payment && (payment.payment_status === 'completed' || payment.payment_status === 'pending_verification')) {
                toast.success('Payment already submitted');
                router.replace('/patient/dashboard');
            }
        }
    };

    const handlePayment = async () => {
        if (!transactionId.trim()) {
            toast.error('Please enter UPI Transaction ID');
            return;
        }

        setLoading(true);
        try {
            // Create payment record with pending status
            const { error } = await createPayment({
                patient_id: patient.id,
                amount: 99,
                payment_status: 'pending_verification',
                transaction_id: transactionId
            });

            if (error) throw error;

            toast.success('Payment submitted for verification');
            router.push('/patient/dashboard');
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.message || 'Payment submission failed');
        } finally {
            setLoading(false);
        }
    };

    if (!patient) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900 selection:bg-indigo-100">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/20">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete Subscription</h1>
                    <p className="text-slate-500">Unlock full access to CareOn features.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Order Summary */}
                    <div className="md:col-span-1">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-8">
                            <h3 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider opacity-70">Order Summary</h3>
                            <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                                <div>
                                    <p className="font-bold text-slate-900 text-lg">Monthly Plan</p>
                                    <p className="text-xs text-slate-500 mt-1">Billed monthly</p>
                                </div>
                                <p className="font-bold text-slate-900 text-xl">₹99</p>
                            </div>
                            <div className="flex justify-between items-center mb-8">
                                <p className="font-bold text-slate-600">Total</p>
                                <p className="font-bold text-2xl text-indigo-600">₹99</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Secure SSL Encryption</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="md:col-span-2">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h3 className="font-bold text-slate-900 mb-8 text-sm uppercase tracking-wider opacity-70">UPI Payment</h3>

                            {!showTransactionInput ? (
                                <div className="space-y-8">
                                    {/* QR Code */}
                                    <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-slate-100">
                                            <img src="/images/upi-qr.png" alt="UPI QR Code" className="w-64 h-64 object-contain" />
                                        </div>
                                        <p className="font-bold text-slate-900 text-lg">Scan to Pay ₹99</p>
                                        <p className="text-sm text-slate-500 mt-2 mb-6">Use any UPI app to complete payment</p>

                                        <div className="w-full max-w-md space-y-3 text-left bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                            <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Payment Steps:</p>
                                            <ol className="text-sm text-indigo-800 space-y-2 list-decimal list-inside">
                                                <li>Scan QR code with any UPI app</li>
                                                <li>Pay ₹99</li>
                                                <li>Copy the Transaction ID</li>
                                                <li>Enter it below</li>
                                            </ol>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowTransactionInput(true)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                                    >
                                        I've Completed Payment
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 group-focus-within:text-indigo-600 transition-colors">UPI Transaction ID</label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="e.g., 123456789012"
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 ml-1">Find this in your UPI app payment confirmation</p>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setShowTransactionInput(false)}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl font-bold transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handlePayment}
                                            disabled={loading || !transactionId.trim()}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    Submit Payment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
