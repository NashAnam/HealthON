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

            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="container mx-auto px-6 py-5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-900" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">Health Reports</h1>
                            <p className="text-sm font-bold text-gray-400">Track your progress & view lab results</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Progress Report Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Progress Report</h3>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analysis</span>
                            </div>

                            <div className="space-y-4 mb-8">
                                <ReportMetric
                                    label="On time appointments"
                                    value={`${metrics?.appointmentRate || 0}%`}
                                    points={metrics?.appointmentRate * 3 || 0}
                                />
                                <ReportMetric
                                    label="Active reminders"
                                    value={metrics?.activeReminders || 0}
                                    points={metrics?.activeReminders * 50 || 0}
                                />
                                <ReportMetric
                                    label="Sleep Quality"
                                    value={metrics?.sleepQuality || 'N/A'}
                                    points={metrics?.avgSleep >= 7 ? 150 : 100}
                                />

                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center mb-6">
                                    <span className="text-sm font-black text-gray-900 uppercase">Total Power Points</span>
                                    <span className="text-xl font-black text-plum-800 tracking-tighter">{patient?.reward_points?.toLocaleString() || 0} pts</span>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comments</label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Add notes about your progress..."
                                        className="w-full mt-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-plum-800/10 min-h-[100px] resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleShareToNetwork}
                                className="w-full py-4 bg-plum-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-plum-800/20 flex items-center justify-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share to Network
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
                                    <div key={report.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                                                    <FlaskConical className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{report.test_type || 'Lab Test'}</h3>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{new Date(report.test_date).toLocaleDateString()}</span>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${report.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {report.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {report.notes && (
                                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                                                <p className="text-sm text-gray-700">{report.notes}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            {report.report_url && (
                                                <button
                                                    onClick={() => handleDownload(report.report_url)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download Report
                                                </button>
                                            )}
                                            <button
                                                onClick={() => router.push('/patient/lab-booking')}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                            >
                                                Book Another Test
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

// Report Metric Component
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
