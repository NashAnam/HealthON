'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function PaymentStatusContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const txnId = searchParams.get('txnId');
    const [status, setStatus] = useState('checking');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        if (txnId) {
            checkPaymentStatus();
        }
    }, [txnId]);

    const checkPaymentStatus = async () => {
        try {
            const response = await fetch(`/api/phonepe/status?txnId=${txnId}`);
            const data = await response.json();

            if (data.success) {
                if (data.status === 'COMPLETED' || data.code === 'PAYMENT_SUCCESS') {
                    setStatus('success');
                    setMessage('Payment successful! Redirecting to dashboard...');
                    setTimeout(() => {
                        router.push('/patient/dashboard');
                    }, 2000);
                } else if (data.status === 'PENDING') {
                    setStatus('pending');
                    setMessage('Payment is being processed. Please wait...');
                    setTimeout(checkPaymentStatus, 3000);
                } else {
                    setStatus('failed');
                    setMessage('Payment failed. Please try again.');
                }
            } else {
                setStatus('failed');
                setMessage('Unable to verify payment status.');
            }
        } catch (error) {
            console.error('Status check error:', error);
            setStatus('failed');
            setMessage('Error checking payment status.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 text-center max-w-sm w-full">
                {status === 'checking' && (
                    <>
                        <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-6 animate-spin" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Checking Payment</h2>
                        <p className="text-slate-500">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                        <p className="text-slate-500">{message}</p>
                    </>
                )}

                {status === 'pending' && (
                    <>
                        <Loader2 className="w-16 h-16 text-amber-600 mx-auto mb-6 animate-spin" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Pending</h2>
                        <p className="text-slate-500">{message}</p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h2>
                        <p className="text-slate-500 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/patient/payment')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            Try Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function PaymentStatusPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        }>
            <PaymentStatusContent />
        </Suspense>
    );
}
