'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, supabase } from '@/lib/supabase';
import {
    Activity, Heart, Droplet, Calendar, ArrowLeft, Download,
    FileText, AlertCircle, MoreVertical, Moon, Footprints, Utensils, Pill, TrendingUp
} from 'lucide-react';
import { useSidebar } from '@/lib/SidebarContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import toast from 'react-hot-toast';

export default function WeeklyProgressReport() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [vitalsData, setVitalsData] = useState([]);
    const [dietLogs, setDietLogs] = useState([]);
    const [medicationLogs, setMedicationLogs] = useState([]);
    const [labReports, setLabReports] = useState([]);
    const [symptoms, setSymptoms] = useState([]);
    const [riskScores, setRiskScores] = useState([]);
    const [weekSummary, setWeekSummary] = useState({});
    const { toggle } = useSidebar();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return router.push('/login');

            const { data: pt } = await getPatient(user.id);
            setPatient(pt);

            // Get date range for last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Fetch ALL tracker logs
            const { data: logs } = await supabase
                .from('tracker_logs')
                .select('*')
                .eq('patient_id', pt.id)
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            // Process vitals data for charts
            const logsByDate = {};
            const dietLogsArray = [];
            const medLogsArray = [];
            const symptomsArray = [];

            if (logs && logs.length > 0) {
                logs.forEach(log => {
                    const date = new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short' });

                    if (log.log_type === 'vitals') {
                        if (!logsByDate[date]) {
                            logsByDate[date] = { date, hr: null, sys: null, dia: null, sugar: null, steps: null, sleep: null };
                        }

                        const unit = log.notes?.includes('Unit:') ? log.notes.split('|')[0].replace('Unit:', '').trim() : '';
                        if (unit === 'bpm') {
                            logsByDate[date].hr = parseFloat(log.value) || logsByDate[date].hr;
                        } else if (unit === 'mg/dL') {
                            logsByDate[date].sugar = parseFloat(log.value) || logsByDate[date].sugar;
                        } else if (unit === 'mmHg') {
                            const parts = (log.value || '').split('/');
                            if (parts.length === 2) {
                                logsByDate[date].sys = parseFloat(parts[0]) || logsByDate[date].sys;
                                logsByDate[date].dia = parseFloat(parts[1]) || logsByDate[date].dia;
                            }
                        }
                    } else if (log.log_type === 'activity' && log.notes?.toLowerCase().includes('steps')) {
                        if (!logsByDate[date]) logsByDate[date] = { date, hr: null, sys: null, dia: null, sugar: null, steps: null, sleep: null };
                        logsByDate[date].steps = parseFloat(log.value) || logsByDate[date].steps;
                    } else if (log.log_type === 'sleep') {
                        if (!logsByDate[date]) logsByDate[date] = { date, hr: null, sys: null, dia: null, sugar: null, steps: null, sleep: null };
                        logsByDate[date].sleep = parseFloat(log.value) || logsByDate[date].sleep;
                    } else if (log.log_type === 'diet') {
                        dietLogsArray.push(log);
                    } else if (log.log_type === 'med') {
                        medLogsArray.push(log);
                    } else if (log.log_type === 'symptoms') {
                        symptomsArray.push(log);
                    }
                });
            }

            const last7DaysData = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dayKey = d.toLocaleDateString('en-US', { weekday: 'short' });
                last7DaysData.push(logsByDate[dayKey] || { date: dayKey, hr: null, sys: null, dia: null, sugar: null, steps: null, sleep: null });
            }
            setVitalsData(last7DaysData);
            setDietLogs(dietLogsArray);
            setMedicationLogs(medLogsArray);
            setSymptoms(symptomsArray);

            // Calculate week summary
            const summary = {
                vitalsLogged: logs.filter(l => l.log_type === 'vitals').length,
                dietLogged: dietLogsArray.length,
                medsLogged: medLogsArray.length,
                symptomsLogged: symptomsArray.length,
                totalLogs: logs.length
            };
            setWeekSummary(summary);

            // Fetch lab reports
            const { data: labs } = await supabase
                .from('lab_bookings')
                .select('*')
                .eq('patient_id', pt.id)
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false });
            setLabReports(labs || []);

            // Fetch latest risk assessment scores
            const { data: assessments } = await supabase
                .from('health_assessments')
                .select('*')
                .eq('patient_id', pt.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (assessments && assessments.length > 0) {
                const assessment = assessments[0];
                const scores = [];
                if (assessment.heart_risk_score !== undefined) {
                    scores.push({ disease: 'Heart Disease', score: assessment.heart_risk_score });
                }
                if (assessment.diabetes_risk_score !== undefined) {
                    scores.push({ disease: 'Diabetes', score: assessment.diabetes_risk_score });
                }
                if (assessment.hypertension_risk_score !== undefined) {
                    scores.push({ disease: 'Hypertension', score: assessment.hypertension_risk_score });
                }
                setRiskScores(scores);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading weekly report:', error);
            setLoading(false);
        }
    };

    const handleDownloadReport = () => {
        if (!patient) {
            toast.error('Patient data not loaded');
            return;
        }

        const tid = toast.loading('Generating report...');

        try {
            let report = `# HealthOn Weekly Medical Report\n`;
            report += `**Patient Name:** ${patient.name}\n`;
            report += `**Period:** ${new Date(new Date().setDate(new Date().getDate() - 7)).toLocaleDateString()} - ${new Date().toLocaleDateString()}\n\n`;
            report += `---\n\n`;

            // Vitals
            report += `## 📊 Vitals Summary\n`;
            report += `| Metric | Average | Status |\n`;
            report += `| :--- | :--- | :--- |\n`;

            const avgHr = vitalsData.filter(d => d.hr).length > 0
                ? Math.round(vitalsData.filter(d => d.hr).reduce((sum, d) => sum + d.hr, 0) / vitalsData.filter(d => d.hr).length)
                : 'N/A';
            report += `| **Heart Rate** | ${avgHr} bpm | ${avgHr !== 'N/A' ? (avgHr < 100 ? 'Normal' : 'Elevated') : '--'} |\n`;

            const avgSys = vitalsData.filter(d => d.sys).length > 0
                ? Math.round(vitalsData.filter(d => d.sys).reduce((sum, d) => sum + d.sys, 0) / vitalsData.filter(d => d.sys).length)
                : 'N/A';
            const avgDia = vitalsData.filter(d => d.dia).length > 0
                ? Math.round(vitalsData.filter(d => d.dia).reduce((sum, d) => sum + d.dia, 0) / vitalsData.filter(d => d.dia).length)
                : 'N/A';
            report += `| **Blood Pressure** | ${avgSys}/${avgDia} mmHg | ${avgSys !== 'N/A' ? (avgSys < 130 ? 'Stable' : 'High') : '--'} |\n`;

            const avgSugar = vitalsData.filter(d => d.sugar).length > 0
                ? Math.round(vitalsData.filter(d => d.sugar).reduce((sum, d) => sum + d.sugar, 0) / vitalsData.filter(d => d.sugar).length)
                : 'N/A';
            report += `| **Blood Glucose** | ${avgSugar} mg/dL | ${avgSugar !== 'N/A' ? (avgSugar < 140 ? 'Good Control' : 'Check Log') : '--'} |\n\n`;

            report += `---\n\n`;

            // Diet
            report += `## 🍎 Diet & Lifestyle\n`;
            report += `* **Total Meals Logged:** ${dietLogs.length}\n`;
            report += `* **Recent Entries:** ${dietLogs.slice(0, 5).map(l => l.value || l.notes).join(', ') || 'None'}\n\n`;

            report += `---\n\n`;

            // Meds
            report += `## 💊 Medication Adherence\n`;
            report += `* **Total Doses Logged:** ${medicationLogs.length}\n`;
            report += `* **Recent Meds:** ${[...new Set(medicationLogs.map(l => l.value))].join(', ') || 'None'}\n\n`;

            report += `---\n\n`;

            // Risk Scores
            report += `## ⚠️ Health Risk Scores (AI Insight)\n`;
            riskScores.forEach(rs => {
                const label = rs.score <= 3 ? 'Low' : rs.score <= 6 ? 'Moderate' : 'High';
                report += `* **${rs.disease}:** ${rs.score}/10 (${label})\n`;
            });
            if (riskScores.length === 0) report += `* No risk assessments found for this period.\n`;
            report += `\n---\n\n`;

            // Lab Reports
            report += `## 🧪 Lab Reports\n`;
            labReports.forEach(lab => {
                report += `* **${lab.test_type || 'Lab Test'}:** ${new Date(lab.test_date || lab.created_at).toLocaleDateString()}${lab.report_url ? ' (Report Available)' : ''}\n`;
            });
            if (labReports.length === 0) report += `* No lab tests reported this week.\n`;
            report += `\n---\n\n`;

            // Symptoms
            report += `## 🩺 Symptoms\n`;
            symptoms.forEach(s => {
                report += `* **${s.value}:** ${s.notes} (${new Date(s.created_at).toLocaleDateString()})\n`;
            });
            if (symptoms.length === 0) report += `* No symptoms reported this week.\n`;

            report += `\n***Disclaimer:** This report is for informational purposes only and does not replace professional medical advice. Always consult your doctor for diagnosis or treatment.*\n`;

            // Create and trigger download
            const blob = new Blob([report], { type: 'text/markdown' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `HealthOn_Report_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Report downloaded successfully!', { id: tid });
        } catch (error) {
            console.error('Download report error:', error);
            toast.error('Failed to generate report', { id: tid });
        }
    };

    const getRiskColor = (score) => {
        if (score <= 3) return 'text-green-600 bg-green-50';
        if (score <= 6) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getRiskLabel = (score) => {
        if (score <= 3) return 'Low Risk';
        if (score <= 6) return 'Moderate Risk';
        return 'High Risk';
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#4a2b3d] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFB] pb-20">
            {/* Header */}
            <header className="bg-white sticky top-0 z-30 border-b border-gray-100 px-6 py-6 shadow-sm">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={toggle} className="lg:hidden p-2 -ml-2 text-[#4a2b3d] hover:bg-gray-50 rounded-xl transition-colors">
                            <MoreVertical className="w-6 h-6" />
                        </button>
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
                            <ArrowLeft className="w-6 h-6 text-slate-900" />
                        </button>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Weekly Report</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last 7 Days</p>
                    </div>
                    <button onClick={handleDownloadReport} className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
                        <Download className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                {/* Week Summary Card */}
                <div className="bg-gradient-to-br from-[#5D2A42] to-[#4a2135] p-8 rounded-[2.5rem] text-white shadow-xl">
                    <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Week at a Glance</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Vitals</p>
                            <p className="text-3xl font-black">{weekSummary.vitalsLogged || 0}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Diet Logs</p>
                            <p className="text-3xl font-black">{weekSummary.dietLogged || 0}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Medications</p>
                            <p className="text-3xl font-black">{weekSummary.medsLogged || 0}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Total Logs</p>
                            <p className="text-3xl font-black">{weekSummary.totalLogs || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Risk Assessment Scores */}
                {riskScores.length > 0 && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#5D2A42]/10 rounded-2xl text-[#5D2A42]">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Risk Assessment</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Health Risk Scores</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {riskScores.map((risk, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-black text-slate-900">{risk.disease}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${getRiskColor(risk.score)}`}>
                                            {getRiskLabel(risk.score)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${risk.score <= 3 ? 'bg-green-500' : risk.score <= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${(risk.score / 10) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-2xl font-black text-slate-900 min-w-[3rem] text-right">{risk.score}/10</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vitals Charts */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Vital Signs Trends</h2>

                    {/* Heart Rate */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-rose-600" />
                                <h3 className="font-black text-slate-900">Heart Rate</h3>
                            </div>
                            <span className="text-xl font-black text-slate-900">
                                {vitalsData.filter(d => d.hr).length > 0
                                    ? Math.round(vitalsData.filter(d => d.hr).reduce((sum, d) => sum + d.hr, 0) / vitalsData.filter(d => d.hr).length)
                                    : '--'} <span className="text-xs text-slate-400">avg bpm</span>
                            </span>
                        </div>
                        <div className="h-40">
                            {vitalsData.filter(d => d.hr).length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={vitalsData}>
                                        <defs>
                                            <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorHr)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-sm text-slate-400">No data</div>}
                        </div>
                    </div>

                    {/* Blood Pressure */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-black text-slate-900">Blood Pressure</h3>
                            </div>
                            <span className="text-xl font-black text-slate-900">
                                {vitalsData.filter(d => d.sys).length > 0
                                    ? `${Math.round(vitalsData.filter(d => d.sys).reduce((sum, d) => sum + d.sys, 0) / vitalsData.filter(d => d.sys).length)}/${Math.round(vitalsData.filter(d => d.dia).reduce((sum, d) => sum + d.dia, 0) / vitalsData.filter(d => d.dia).length)}`
                                    : '--/--'} <span className="text-xs text-slate-400">mmHg</span>
                            </span>
                        </div>
                        <div className="h-40">
                            {vitalsData.filter(d => d.sys).length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={vitalsData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                                        <YAxis hide />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="sys" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                                        <Line type="monotone" dataKey="dia" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Diastolic" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-sm text-slate-400">No data</div>}
                        </div>
                    </div>

                    {/* Blood Glucose */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Droplet className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-black text-slate-900">Blood Glucose</h3>
                            </div>
                            <span className="text-xl font-black text-slate-900">
                                {vitalsData.filter(d => d.sugar).length > 0
                                    ? Math.round(vitalsData.filter(d => d.sugar).reduce((sum, d) => sum + d.sugar, 0) / vitalsData.filter(d => d.sugar).length)
                                    : '--'} <span className="text-xs text-slate-400">mg/dL</span>
                            </span>
                        </div>
                        <div className="h-40">
                            {vitalsData.filter(d => d.sugar).length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={vitalsData}>
                                        <defs>
                                            <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                                        <YAxis hide />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="sugar" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSugar)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-sm text-slate-400">No data</div>}
                        </div>
                    </div>
                </div>

                {/* Diet & Medication Adherence */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Diet Logs */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                                <Utensils size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Diet Logs</h2>
                                <p className="text-xs font-bold text-slate-400">{dietLogs.length} entries this week</p>
                            </div>
                        </div>
                        {dietLogs.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {dietLogs.slice(0, 5).map((log, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 rounded-xl text-sm">
                                        <p className="font-bold text-slate-900">{log.value || log.notes}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-slate-400 text-center py-8">No diet logs this week</p>}
                    </div>

                    {/* Medication Adherence */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                <Pill size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Medications</h2>
                                <p className="text-xs font-bold text-slate-400">{medicationLogs.length} doses logged</p>
                            </div>
                        </div>
                        {medicationLogs.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {medicationLogs.slice(0, 5).map((log, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 rounded-xl text-sm">
                                        <p className="font-bold text-slate-900">{log.value}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-slate-400 text-center py-8">No medication logs this week</p>}
                    </div>
                </div>

                {/* Lab Reports */}
                {labReports.length > 0 && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#648C81]/10 rounded-2xl text-[#648C81]">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Lab Reports</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">This Week</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {labReports.map((lab, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="font-black text-slate-900">{lab.test_type || 'Lab Test'}</p>
                                        <p className="text-xs font-bold text-slate-500">
                                            {new Date(lab.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    {lab.report_url && (
                                        <button
                                            onClick={() => window.open(lab.report_url, '_blank')}
                                            className="px-4 py-2 bg-[#648C81] text-white rounded-xl text-xs font-black hover:bg-[#5a7a6f] transition-all"
                                        >
                                            View
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Symptoms */}
                {symptoms.length > 0 && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Symptoms</h2>
                                <p className="text-xs font-bold text-slate-400">{symptoms.length} logged this week</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {symptoms.map((symptom, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="font-black text-slate-900">{symptom.value || 'Symptom'}</p>
                                    <p className="text-xs text-slate-600 mt-1">{symptom.notes}</p>
                                    <p className="text-xs font-bold text-slate-500 mt-2">
                                        {new Date(symptom.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
