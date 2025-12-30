'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser, getPatient, getLabBookings, getPatientAppointments, getReminders, supabase
} from '@/lib/supabase';
import {
    FileText, Download, Calendar, ArrowLeft, FlaskConical, Share2, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
    const router = useRouter();
    const [patient, setPatient] = useState(null);
    const [reports, setReports] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [comments, setComments] = useState('');
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

        // Fetch progress metrics
        await loadProgressMetrics(patientData.id);

        setLoading(false);
    };

    const loadProgressMetrics = async (patientId) => {
        // Fetch appointments
        const { data: appointmentsData } = await getPatientAppointments(patientId);

        // Fetch reminders
        const { data: remindersData } = await getReminders(patientId);

        // Fetch vitals for sleep data
        const { data: vitalsData } = await supabase
            .from('vitals')
            .select('*')
            .eq('patient_id', patientId)
            .order('recorded_at', { ascending: false })
            .limit(7);

        // Calculate metrics
        const totalAppointments = appointmentsData?.length || 0;
        const completedAppointments = appointmentsData?.filter(a => a.status === 'completed')?.length || 0;
        const appointmentRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

        const activeReminders = remindersData?.filter(r => r.is_active)?.length || 0;
        const totalReminders = remindersData?.length || 0;
        const reminderRate = totalReminders > 0 ? Math.round((activeReminders / totalReminders) * 100) : 0;

        const avgSleep = vitalsData?.length > 0
            ? (vitalsData.reduce((sum, v) => sum + (v.sleep_hours || 0), 0) / vitalsData.length).toFixed(1)
            : 0;

        setMetrics({
            appointmentRate,
            reminderRate,
            activeReminders,
            sleepQuality: avgSleep >= 7 ? 'Excellent' : avgSleep >= 6 ? 'Good' : 'Fair',
            avgSleep
        });
    };

    const handleDownload = (reportUrl) => {
        if (!reportUrl) {
            toast.error('Report not available');
            return;
        }
        window.open(reportUrl, '_blank');
        toast.success('Opening report...');
    };

    const handleShareToNetwork = async () => {
        if (!patient || !metrics) return;

        const tid = toast.loading('Sharing to network...');
        try {
            await supabase.from('network_posts').insert({
                patient_id: patient.id,
                title: 'My Health Progress Report',
                content_text: `📈 Health Progress Update!

✅ Appointments: ${metrics.appointmentRate}% Attendance
⏰ Active Reminders: ${metrics.activeReminders}
😴 Sleep Quality: ${metrics.sleepQuality} (${metrics.avgSleep}h avg)
🏆 Total Points: ${patient.reward_points || 0}

${comments || 'Staying committed to my health journey!'}`,
            });
            toast.success('Shared with the community!', { id: tid });
            setComments('');
        } catch (error) {
            console.error('Share error:', error);
            toast.error('Failed to share', { id: tid });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]"><div className="w-12 h-12 border-4 border-plum-200 border-t-plum-800 rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-20">
            {/* Compact Internal Header for Mobile Only */}
            <div className="lg:hidden bg-white border-b border-gray-100 px-6 py-4 mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.replace('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-900" />
                    </button>
                    <h1 className="text-xl font-black text-gray-900">Reports</h1>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Progress Report Section - High Density */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 sticky top-24">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Progress Insight</h3>
                                <TrendingUp className="w-4 h-4 text-plum-600" />
                            </div>

                            <div className="space-y-3 mb-6">
                                <ReportMetric
                                    label="Apt Attendance"
                                    value={`${metrics?.appointmentRate || 0}%`}
                                    points={metrics?.appointmentRate * 3 || 0}
                                />
                                <ReportMetric
                                    label="Active Alarms"
                                    value={metrics?.activeReminders || 0}
                                    points={metrics?.activeReminders * 50 || 0}
                                />
                                <ReportMetric
                                    label="Sleep Quality"
                                    value={metrics?.sleepQuality || 'N/A'}
                                    points={metrics?.avgSleep >= 7 ? 150 : 100}
                                />

                                <div className="pt-3 border-t border-gray-100 flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reward</span>
                                    <span className="text-lg font-black text-plum-800 tracking-tighter">{patient?.reward_points?.toLocaleString() || 0} pts</span>
                                </div>

                                <div className="mb-4">
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Add progress notes..."
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-plum-800/10 min-h-[80px] resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleShareToNetwork}
                                className="w-full py-3.5 bg-plum-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-plum-800/20 flex items-center justify-center gap-2"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                Share Update
                            </button>
                        </div>
                    </div>

                    {/* Lab Reports Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Lab Results</h2>
                            <button
                                onClick={() => router.push('/patient/lab-booking')}
                                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all"
                            >
                                + Book Lab Test
                            </button>
                        </div>

                        <div className="space-y-6">
                            {reports.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                    <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Lab Reports Yet</h3>
                                    <p className="text-gray-500 mb-6">Your completed lab test results will appear here</p>
                                </div>
                            ) : (
                                reports.map((report) => (
                                    <div key={report.id} className="bg-white rounded-[2rem] p-5 md:p-6 shadow-sm border border-gray-100 hover:border-teal-200 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                                                    <FlaskConical className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-black text-gray-900 leading-none">{report.test_type || 'Lab Test'}</h3>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Calendar className="w-3 h-3 text-gray-400" />
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(report.test_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${report.status === 'completed' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                                                'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </div>

                                        {report.notes && (
                                            <p className="text-xs text-gray-500 font-medium bg-gray-50/50 p-4 rounded-xl mb-4 border border-gray-50 line-clamp-2">{report.notes}</p>
                                        )}

                                        <div className="flex gap-2">
                                            {report.report_url && (
                                                <button
                                                    onClick={() => handleDownload(report.report_url)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Get PDF
                                                </button>
                                            )}
                                            <button
                                                onClick={() => router.push('/patient/lab-booking')}
                                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
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

function ReportMetric({ label, value, points }) {
    return (
        <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">{label}</span>
            <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900">{value}</span>
                <span className="text-xs text-plum-600 font-black">+{points}</span>
            </div>
        </div>
    );
}
