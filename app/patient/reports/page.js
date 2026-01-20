'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser, getPatient, getLabBookings, supabase
} from '@/lib/supabase';
import {
    FileText, Download, Calendar, ArrowLeft, FlaskConical
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
    const router = useRouter();
    const [patient, setPatient] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const user = await getCurrentUser();
        if (!user) return router.push('/login');

        const { data: patientData } = await getPatient(user.id);
        if (!patientData) return;
        setPatient(patientData);

        // Fetch lab reports
        const { data: bookingData } = await getLabBookings(patientData.id);
        const completedReports = bookingData?.filter(b => b.status === 'completed' || b.report_url) || [];
        setReports(completedReports);

        setLoading(false);
    };

    const handleDownload = (reportUrl) => {
        if (!reportUrl) {
            toast.error('Report not available');
            return;
        }
        window.open(reportUrl, '_blank');
        toast.success('Opening report...');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]"><div className="w-12 h-12 border-4 border-plum-200 border-t-plum-800 rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-20 overflow-x-hidden">
            {/* Compact Internal Header for Mobile Only */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.replace('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-900" />
                    </button>
                    <h1 className="text-xl font-black text-slate-900">Reports</h1>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="max-w-4xl mx-auto">

                    {/* Lab Reports Section */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Lab Results</h2>
                            <button
                                onClick={() => router.push('/patient/lab-booking')}
                                className="px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                            >
                                + Book Lab Test
                            </button>
                        </div>

                        <div className="space-y-6">
                            {reports.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
                                    <FlaskConical className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Lab Reports Yet</h3>
                                    <p className="text-slate-500 mb-6">Your completed lab test results will appear here</p>
                                </div>
                            ) : (
                                reports.map((report) => (
                                    <div key={report.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-200 hover:border-teal-200 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-700 group-hover:scale-110 transition-transform">
                                                    <FlaskConical className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 leading-none">{report.test_type || 'Lab Test'}</h3>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Calendar className="w-4 h-4 text-slate-500" />
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                            {report.test_date ? new Date(report.test_date).toLocaleDateString('en-US') : 'Date N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${report.status === 'completed' ? 'bg-teal-50 text-teal-800 border border-teal-100' :
                                                'bg-amber-50 text-amber-800 border border-amber-100'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </div>

                                        {report.notes && (
                                            <p className="text-sm text-slate-600 font-medium bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 line-clamp-2">{report.notes}</p>
                                        )}

                                        <div className="flex gap-4">
                                            {report.report_url && (
                                                <button
                                                    onClick={() => handleDownload(report.report_url)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Get PDF
                                                </button>
                                            )}
                                            <button
                                                onClick={() => router.push('/patient/lab-booking')}
                                                className="flex-1 py-3.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:border-slate-300 hover:bg-slate-50 transition-all"
                                            >
                                                Reschedule
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
