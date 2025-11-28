'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, RefreshCw, Users, Stethoscope, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('payments');
    const [payments, setPayments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'payments') {
                await fetchPendingPayments();
            } else if (activeTab === 'doctors') {
                await fetchPendingDoctors();
            } else if (activeTab === 'labs') {
                await fetchPendingLabs();
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingPayments = async () => {
        const { data, error } = await supabase
            .from('payments')
            .select(`id, created_at, amount, payment_status, transaction_id, patient_id, patients (name, phone, user_id)`)
            .eq('payment_status', 'pending_verification')
            .order('created_at', { ascending: false });

        if (error) throw error;
        setPayments(data || []);
    };

    const fetchPendingDoctors = async () => {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('verified', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        setDoctors(data || []);
    };

    const fetchPendingLabs = async () => {
        const { data, error } = await supabase
            .from('labs')
            .select('*')
            .eq('verified', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        setLabs(data || []);
    };

    const handleApprovePayment = async (payment) => {
        if (!confirm(`Confirm receipt of ₹${payment.amount} from ${payment.patients?.name}?`)) return;

        setProcessingId(payment.id);
        try {
            const subscriptionEndDate = new Date();
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

            await supabase
                .from('patients')
                .update({ subscription_end_date: subscriptionEndDate.toISOString() })
                .eq('user_id', payment.patients.user_id);

            await supabase
                .from('payments')
                .update({ payment_status: 'completed' })
                .eq('id', payment.id);

            toast.success('Payment Approved & Subscription Activated');
            fetchData();
        } catch (error) {
            toast.error('Error approving payment');
        } finally {
            setProcessingId(null);
        }
    };

    const handleVerifyDoctor = async (doctorId, doctorName) => {
        if (!confirm(`Verify ${doctorName} as a doctor?`)) return;

        setProcessingId(doctorId);
        try {
            const { error } = await supabase
                .from('doctors')
                .update({ verified: true })
                .eq('id', doctorId);

            if (error) throw error;
            toast.success('Doctor verified successfully!');
            fetchData();
        } catch (error) {
            toast.error('Error verifying doctor');
        } finally {
            setProcessingId(null);
        }
    };

    const handleVerifyLab = async (labId, labName) => {
        if (!confirm(`Verify ${labName} as a lab?`)) return;

        setProcessingId(labId);
        try {
            const { error } = await supabase
                .from('labs')
                .update({ verified: true })
                .eq('id', labId);

            if (error) throw error;
            toast.success('Lab verified successfully!');
            fetchData();
        } catch (error) {
            toast.error('Error verifying lab');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id, type) => {
        if (!confirm(`Are you sure you want to reject this ${type}?`)) return;

        setProcessingId(id);
        try {
            if (type === 'payment') {
                await supabase.from('payments').update({ payment_status: 'rejected' }).eq('id', id);
            } else if (type === 'doctor') {
                await supabase.from('doctors').delete().eq('id', id);
            } else if (type === 'lab') {
                await supabase.from('labs').delete().eq('id', id);
            }

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} rejected`);
            fetchData();
        } catch (error) {
            toast.error(`Error rejecting ${type}`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage payments, doctors, and labs</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'payments'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        Payments ({payments.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('doctors')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'doctors'
                                ? 'bg-violet-600 text-white shadow-lg'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Stethoscope className="w-5 h-5" />
                        Doctors ({doctors.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('labs')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'labs'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <FlaskConical className="w-5 h-5" />
                        Labs ({labs.length})
                    </button>
                    <button
                        onClick={fetchData}
                        className="ml-auto p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                    >
                        <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    {activeTab === 'payments' && (
                        <PaymentsTable
                            payments={payments}
                            loading={loading}
                            processingId={processingId}
                            onApprove={handleApprovePayment}
                            onReject={(id) => handleReject(id, 'payment')}
                        />
                    )}
                    {activeTab === 'doctors' && (
                        <DoctorsTable
                            doctors={doctors}
                            loading={loading}
                            processingId={processingId}
                            onVerify={handleVerifyDoctor}
                            onReject={(id) => handleReject(id, 'doctor')}
                        />
                    )}
                    {activeTab === 'labs' && (
                        <LabsTable
                            labs={labs}
                            loading={loading}
                            processingId={processingId}
                            onVerify={handleVerifyLab}
                            onReject={(id) => handleReject(id, 'lab')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function PaymentsTable({ payments, loading, processingId, onApprove, onReject }) {
    return (
        <table className="w-full">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Date</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Patient</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Transaction ID</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Amount</th>
                    <th className="p-6 text-right font-bold text-slate-600 text-sm">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {payments.length === 0 ? (
                    <tr><td colSpan="5" className="p-10 text-center text-slate-500">{loading ? 'Loading...' : 'No pending payments'}</td></tr>
                ) : (
                    payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-6 text-slate-600">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="p-6"><p className="font-bold">{p.patients?.name}</p><p className="text-sm text-slate-500">{p.patients?.phone}</p></td>
                            <td className="p-6"><span className="font-mono bg-slate-100 px-3 py-1 rounded text-sm">{p.transaction_id}</span></td>
                            <td className="p-6 font-bold text-emerald-600">₹{p.amount}</td>
                            <td className="p-6 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => onReject(p.id)} disabled={processingId === p.id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><XCircle className="w-6 h-6" /></button>
                                    <button onClick={() => onApprove(p)} disabled={processingId === p.id} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold"><CheckCircle2 className="w-5 h-5" />Approve</button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}

function DoctorsTable({ doctors, loading, processingId, onVerify, onReject }) {
    return (
        <table className="w-full">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Name</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Qualification</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Experience</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Timings</th>
                    <th className="p-6 text-right font-bold text-slate-600 text-sm">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {doctors.length === 0 ? (
                    <tr><td colSpan="5" className="p-10 text-center text-slate-500">{loading ? 'Loading...' : 'No pending doctors'}</td></tr>
                ) : (
                    doctors.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                            <td className="p-6 font-bold">{d.name}</td>
                            <td className="p-6 text-slate-600">{d.qualification}</td>
                            <td className="p-6 text-slate-600">{d.experience}</td>
                            <td className="p-6 text-slate-600">{d.timings}</td>
                            <td className="p-6 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => onReject(d.id)} disabled={processingId === d.id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><XCircle className="w-6 h-6" /></button>
                                    <button onClick={() => onVerify(d.id, d.name)} disabled={processingId === d.id} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl font-bold"><CheckCircle2 className="w-5 h-5" />Verify</button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}

function LabsTable({ labs, loading, processingId, onVerify, onReject }) {
    return (
        <table className="w-full">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Name</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Address</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">License</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Tests</th>
                    <th className="p-6 text-right font-bold text-slate-600 text-sm">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {labs.length === 0 ? (
                    <tr><td colSpan="5" className="p-10 text-center text-slate-500">{loading ? 'Loading...' : 'No pending labs'}</td></tr>
                ) : (
                    labs.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-6 font-bold">{l.name}</td>
                            <td className="p-6 text-slate-600">{l.address}</td>
                            <td className="p-6 text-slate-600">{l.license_number}</td>
                            <td className="p-6 text-slate-600 text-sm">{l.tests_list?.substring(0, 50)}...</td>
                            <td className="p-6 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => onReject(l.id)} disabled={processingId === l.id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><XCircle className="w-6 h-6" /></button>
                                    <button onClick={() => onVerify(l.id, l.name)} disabled={processingId === l.id} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold"><CheckCircle2 className="w-5 h-5" />Verify</button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}
