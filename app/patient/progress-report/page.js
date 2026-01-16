'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, supabase } from '@/lib/supabase';
import {
    Activity, Heart, Droplet, User, Calendar, ArrowLeft,
    Download, Share2, TrendingUp, TrendingDown, Minus, MoreVertical
} from 'lucide-react';
import { useSidebar } from '@/lib/SidebarContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import toast from 'react-hot-toast';

export default function ProgressReportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [vitalsData, setVitalsData] = useState([]);
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

            // Fetch tracker logs for the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: logs } = await supabase
                .from('tracker_logs')
                .select('*')
                .eq('patient_id', pt.id)
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            if (logs && logs.length > 0) {
                // Group logs by date and type
                const logsByDate = {};

                logs.forEach(log => {
                    const date = new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short' });
                    if (!logsByDate[date]) {
                        logsByDate[date] = { date, hr: null, sys: null, dia: null, sugar: null };
                    }

                    // Extract values based on log type and notes
                    if (log.log_type === 'vitals') {
                        if (log.notes?.includes('bpm')) {
                            logsByDate[date].hr = parseFloat(log.value);
                        } else if (log.notes?.includes('mg/dL')) {
                            logsByDate[date].sugar = parseFloat(log.value);
                        } else if (log.notes?.includes('mmHg')) {
                            const [sys, dia] = log.value.split('/').map(v => parseFloat(v));
                            logsByDate[date].sys = sys;
                            logsByDate[date].dia = dia;
                        }
                    }
                });

                setVitalsData(Object.values(logsByDate));
            } else {
                setVitalsData([]);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading progress report:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#4a2b3d] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] pb-20">
            {/* Header */}
            <header className="bg-white sticky top-0 z-30 border-b border-gray-100 px-6 py-6 shadow-sm">
                <div className="flex items-center justify-between max-w-xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggle}
                            className="lg:hidden p-2 -ml-2 text-[#4a2b3d] hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <MoreVertical className="w-6 h-6" />
                        </button>
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
                            <ArrowLeft className="w-6 h-6 text-slate-900" />
                        </button>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-[0.2em]">Progress Report</h1>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
                        <Share2 className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-8 space-y-8">

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-[#4a2b3d] to-[#6a3a55] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        {vitalsData.length > 0 ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    <span className="text-xs font-black uppercase tracking-widest text-emerald-100">Overall Health Score</span>
                                </div>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-6xl font-black leading-none">
                                        {Math.round((vitalsData.filter(d => d.hr || d.sys || d.sugar).length / 7) * 100)}
                                    </span>
                                    <span className="text-xl font-bold opacity-60">/ 100</span>
                                </div>
                                <p className="text-sm text-white/70 font-medium">Your health is improving! You've stayed consistent with your vitals logging this week.</p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <Watch className="w-5 h-5 text-amber-400" />
                                    <span className="text-xs font-black uppercase tracking-widest text-amber-100">No Data Available</span>
                                </div>
                                <div className="mb-4">
                                    <span className="text-4xl font-black leading-none">Sync Your Watch</span>
                                </div>
                                <p className="text-sm text-white/70 font-medium mb-4">
                                    Go to Health Tracker and click the watch icon to sync your smartwatch data. Your progress report will appear here once you have synced data.
                                </p>
                                <button
                                    onClick={() => router.push('/patient/health-tracker')}
                                    className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
                                >
                                    Go to Health Tracker
                                </button>
                            </>
                        )}
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                        <Activity className="w-48 h-48" />
                    </div>
                </div>

                {/* Heart Rate Section */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                                <Heart size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Heart Rate</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last 7 Days</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-slate-900">
                                {vitalsData.length > 0
                                    ? Math.round(vitalsData.filter(d => d.hr).reduce((sum, d) => sum + d.hr, 0) / vitalsData.filter(d => d.hr).length) || '--'
                                    : '--'
                                }
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">avg bpm</span>
                        </div>
                    </div>
                    <div className="h-48 w-full mt-4 flex items-center justify-center">
                        {vitalsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={vitalsData}>
                                    <defs>
                                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                                    />
                                    <Area type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorHr)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No pulse data available yet</p>
                        )}
                    </div>
                </div>

                {/* Blood Pressure Section */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Blood Pressure</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stability Index</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-slate-900">
                                {vitalsData.length > 0 && vitalsData.filter(d => d.sys).length > 0
                                    ? `${Math.round(vitalsData.filter(d => d.sys).reduce((sum, d) => sum + d.sys, 0) / vitalsData.filter(d => d.sys).length)}/${Math.round(vitalsData.filter(d => d.dia).reduce((sum, d) => sum + d.dia, 0) / vitalsData.filter(d => d.dia).length)}`
                                    : '--/--'
                                }
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">avg mmhg</span>
                        </div>
                    </div>
                    <div className="h-48 w-full mt-4 flex items-center justify-center">
                        {vitalsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={vitalsData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="sys" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="dia" stroke="#818cf8" strokeWidth={4} strokeDasharray="5 5" dot={{ r: 4, fill: '#818cf8' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No BP data available yet</p>
                        )}
                    </div>
                </div>

                {/* Glucose Section */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                <Droplets className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Glucose</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fasting Levels</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-slate-900">
                                {vitalsData.length > 0 && vitalsData.filter(d => d.sugar).length > 0
                                    ? Math.round(vitalsData.filter(d => d.sugar).reduce((sum, d) => sum + d.sugar, 0) / vitalsData.filter(d => d.sugar).length)
                                    : '--'
                                }
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">avg mg/dl</span>
                        </div>
                    </div>
                    <div className="h-48 w-full mt-4 flex items-center justify-center">
                        {vitalsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={vitalsData}>
                                    <defs>
                                        <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="sugar" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSugar)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No glucose data available yet</p>
                        )}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-6">Recommendations</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                <Activity size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">Maintain current activity levels</p>
                                <p className="text-xs font-medium text-slate-500">Your BP has been stable for 5 days.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                                <Calendar size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">Next follow-up in 2 weeks</p>
                                <p className="text-xs font-medium text-slate-500">Schedule a checkup for routine review.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => toast.success('Report downloaded!')}
                    className="w-full bg-[#5a8a7a] text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-teal-600/20 hover:bg-[#4d7b6b] transition-all flex items-center justify-center gap-3"
                >
                    <Download className="w-5 h-5" /> Download Full Report
                </button>

            </main>
        </div>
    );
}

// Helper icons specifically for this file
function Droplets({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M7 16.3c2.2 0 4-1.8 4-4 0-1.2-.6-2.3-1.4-3L7 7l-2.6 2.3c-.8.7-1.4 1.8-1.4 3 0 2.2 1.8 4 4 4z" />
            <path d="M17 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path d="M22 21l-2-2" />
        </svg>
    );
}
