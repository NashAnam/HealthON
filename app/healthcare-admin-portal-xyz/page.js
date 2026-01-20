'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Stethoscope, FlaskConical, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [activeTab, setActiveTab] = useState('doctors');
    const [doctors, setDoctors] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth');
        if (auth === process.env.NEXT_PUBLIC_ADMIN_PASSPHRASE || auth === 'Admin@HealthOn2026') {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [activeTab, isAuthenticated]);

    const handleLogin = (e) => {
        e.preventDefault();
        const secret = process.env.NEXT_PUBLIC_ADMIN_PASSPHRASE || 'Admin@HealthOn2026';
        if (passphrase === secret) {
            setIsAuthenticated(true);
            localStorage.setItem('admin_auth', passphrase);
            toast.success('Access Granted');
        } else {
            toast.error('Invalid Passphrase');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_auth');
        toast.success('Logged out');
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'doctors') {
                await fetchPendingDoctors();
            } else if (activeTab === 'labs') {
                await fetchPendingLabs();
            }
        } finally {
            setLoading(false);
        }
    };

    /*
    const fetchPendingPayments = async () => {
        try {
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select('*')
                .eq('payment_status', 'pending_verification')
                .order('created_at', { ascending: false });

            if (paymentsError) {
                console.error('Payments error:', paymentsError);
                toast.error('Failed to load payments');
                return;
            }

            const enrichedPayments = await Promise.all(
                (paymentsData || []).map(async (payment) => {
                    const { data: patient } = await supabase
                        .from('patients')
                        .select('name, phone, user_id')
                        .eq('id', payment.patient_id)
                        .maybeSingle();

                    return {
                        ...payment,
                        patients: patient || {
                            name: 'Patient ID: ' + payment.patient_id.substring(0, 8),
                            phone: 'N/A',
                            user_id: null
                        }
                    };
                })
            );

            console.log('Loaded payments:', enrichedPayments);
            setPayments(enrichedPayments);
        } catch (err) {
            console.error('Error loading payments:', err);
            toast.error('Error loading payments');
        }
    };
    */

    const fetchPendingDoctors = async () => {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .or('verified.eq.false,verified.is.null')
            .order('created_at', { ascending: false });

        if (error) throw error;
        setDoctors(data || []);
    };

    const fetchPendingLabs = async () => {
        const { data, error } = await supabase
            .from('labs')
            .select('*')
            .or('verified.eq.false,verified.is.null')
            .order('created_at', { ascending: false });

        if (error) throw error;
        setLabs(data || []);
    };

    /*
    const handleApprovePayment = async (payment) => {
        if (!payment.patients?.user_id) {
            toast.error('Cannot approve: Patient not found in database');
            return;
        }

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
            console.error('Approval error:', error);
            toast.error('Error approving payment');
        } finally {
            setProcessingId(null);
        }
    };
    */

    const handleVerifyDoctor = async (doctorId, doctorName) => {
        // Removed confirm() to avoid silent blocking in some browsers
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
            console.error('Doctor verification error:', error);
            toast.error('Error verifying doctor: ' + (error.message || 'Unknown error'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleVerifyLab = async (labId, labName) => {
        // Removed confirm() to avoid silent blocking in some browsers
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
            console.error('Lab verification error:', error);
            toast.error('Error verifying lab: ' + (error.message || 'Unknown error'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id, type) => {
        setProcessingId(id);
        try {
            // if (type === 'payment') {
            //     await supabase.from('payments').update({ payment_status: 'rejected' }).eq('id', id);
            // } else
            if (type === 'doctor') {
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

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-violet-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-violet-600/20">
                            <RefreshCw className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Security Gateway</h2>
                        <p className="text-slate-400 text-sm font-medium">Enter the administrative passphrase to proceed</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Passphrase"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-3xl px-8 py-5 text-white focus:outline-none focus:ring-4 focus:ring-violet-600/20 transition-all text-center tracking-[0.3em] font-black"
                        />
                        <button
                            type="submit"
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-3xl py-5 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Verify Identity
                        </button>
                    </form>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">HealthOn Automated Security Protocol 4.0</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">HealthON <span className="text-violet-600 italic">Vault</span></h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Administrative Control Mesh</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    {/* <button
                        onClick={() => setActiveTab('payments')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'payments'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        Payments ({payments.length})
                    </button> */}
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
                    {/* {activeTab === 'payments' && (
                        <PaymentsTable
                            payments={payments}
                            loading={loading}
                            processingId={processingId}
                            onApprove={handleApprovePayment}
                            onReject={(id) => handleReject(id, 'payment')}
                        />
                    )} */}
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

/* function PaymentsTable({ payments, loading, processingId, onApprove, onReject }) {
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
            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan="5" className="p-12 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                                Loading payments...
                            </div>
                        </td>
                    </tr>
                ) : payments.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="p-12 text-center text-slate-500">
                            No pending payments
                        </td>
                    </tr>
                ) : (
                    payments.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-slate-50">
                            <td className="p-6 text-sm text-slate-700">
                                {new Date(payment.created_at).toLocaleDateString('en-US')}
                            </td>
                            <td className="p-6">
                                <div className="font-bold text-slate-900">{payment.patients?.name}</div>
                                <div className="text-sm text-slate-500">{payment.patients?.phone}</div>
                            </td>
                            <td className="p-6 text-sm text-slate-700 font-mono">{payment.transaction_id}</td>
                            <td className="p-6 text-lg font-bold text-slate-900">₹{payment.amount}</td>
                            <td className="p-6 text-right">
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => onApprove(payment)}
                                        disabled={processingId === payment.id}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processingId === payment.id ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => onReject(payment.id)}
                                        disabled={processingId === payment.id}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
} */

function DoctorsTable({ doctors, loading, processingId, onVerify, onReject }) {
    return (
        <table className="w-full">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Name</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Qualification</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Experience</th>
                    <th className="p-6 text-right font-bold text-slate-600 text-sm">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-violet-600 rounded-full animate-spin"></div>
                                Loading doctors...
                            </div>
                        </td>
                    </tr>
                ) : doctors.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-500">
                            No pending doctor verifications
                        </td>
                    </tr>
                ) : (
                    doctors.map((doctor) => (
                        <tr key={doctor.id} className="border-b hover:bg-slate-50">
                            <td className="p-6 font-bold text-slate-900">{doctor.name}</td>
                            <td className="p-6 text-sm text-slate-700">{doctor.qualification}</td>
                            <td className="p-6 text-sm text-slate-700">{doctor.experience?.toString().toLowerCase().includes('year') ? doctor.experience : `${doctor.experience} years`}</td>
                            <td className="p-6 text-right">
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => onVerify(doctor.id, doctor.name)}
                                        disabled={processingId === doctor.id}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processingId === doctor.id ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        Verify
                                    </button>
                                    <button
                                        onClick={() => onReject(doctor.id)}
                                        disabled={processingId === doctor.id}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
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
                    <th className="p-6 text-right font-bold text-slate-600 text-sm">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan="3" className="p-12 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
                                Loading labs...
                            </div>
                        </td>
                    </tr>
                ) : labs.length === 0 ? (
                    <tr>
                        <td colSpan="3" className="p-12 text-center text-slate-500">
                            No pending lab verifications
                        </td>
                    </tr>
                ) : (
                    labs.map((lab) => (
                        <tr key={lab.id} className="border-b hover:bg-slate-50">
                            <td className="p-6 font-bold text-slate-900">{lab.name}</td>
                            <td className="p-6 text-sm text-slate-700">{lab.address}</td>
                            <td className="p-6 text-right">
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => onVerify(lab.id, lab.name)}
                                        disabled={processingId === lab.id}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processingId === lab.id ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        Verify
                                    </button>
                                    <button
                                        onClick={() => onReject(lab.id)}
                                        disabled={processingId === lab.id}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}
