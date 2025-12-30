'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    Download, Share2, Activity, Heart, Moon, Zap, ArrowUp, ArrowDown, ChevronLeft, Target, Award
} from 'lucide-react';
import { getCurrentUser, supabase } from '@/lib/supabase';

export default function ProgressPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        score: 82,
        heart: '72 bpm',
        sleep: '7.5h',
        activity: '45 min',
        steps: '8,500'
    });

    useEffect(() => {
        // In a real app, we'd fetch and aggregate here
        setTimeout(() => setLoading(false), 1000);
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]"><div className="w-12 h-12 border-4 border-plum-200 border-t-plum-800 rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="container mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <ChevronLeft className="w-6 h-6 text-gray-900" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">Health Progress</h1>
                            <p className="text-sm font-bold text-gray-400">Weekly Performance & Analytics</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-plum-800 transition-all shadow-sm">
                            <Share2 size={20} />
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-plum-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-plum-800/20">
                            <Download size={18} /> Download
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 space-y-10 max-w-7xl">

                {/* Score Summary Card */}
                <div className="bg-gradient-to-br from-plum-800 to-plum-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left">
                            <p className="text-plum-200 text-xs font-black uppercase tracking-widest mb-2">Overall Health Score</p>
                            <h2 className="text-7xl font-black mb-4">{stats.score}<span className="text-3xl text-plum-300">/100</span></h2>
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
                                <TrendingUp className="text-teal-400 w-4 h-4" />
                                <span className="text-sm font-black text-teal-400">+5.2% <span className="text-white/60 ml-1">improvement this week</span></span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                            <QuickStat icon={Heart} label="Heart" value={stats.heart} color="rose" />
                            <QuickStat icon={Moon} label="Sleep" value={stats.sleep} color="indigo" />
                            <QuickStat icon={Zap} label="Activity" value={stats.activity} color="teal" />
                            <QuickStat icon={Award} label="Points" value="1.2k" color="amber" />
                        </div>
                    </div>
                </div>

                {/* Primary Charts Row */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Heart Rate Trends */}
                    <ChartContainer title="Heart Rate Trends" subtitle="Weekly average & resting heart rate" status="Healthy">
                        <AreaChart data={hrData}>
                            <defs>
                                <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FB7185" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 800, fontSize: 12 }} dy={10} />
                            <YAxis hide domain={[60, 90]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="avg" stroke="#FB7185" strokeWidth={4} fill="url(#hrGradient)" dot={{ r: 4, fill: '#FB7185' }} />
                            <Area type="monotone" dataKey="resting" stroke="#FDA4AF" strokeWidth={2} fillOpacity={0} dot={{ r: 3, fill: '#FDA4AF' }} />
                        </AreaChart>
                    </ChartContainer>

                    {/* Sleep Analysis */}
                    <ChartContainer title="Sleep Analysis" subtitle="Total sleep & deep sleep hours" status="7.5h avg">
                        <AreaChart data={sleepData}>
                            <defs>
                                <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#649488" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#649488" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 800, fontSize: 12 }} dy={10} />
                            <YAxis hide domain={[0, 12]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="total" stroke="#649488" strokeWidth={4} fill="url(#sleepGradient)" dot={{ r: 4, fill: '#649488' }} />
                            <Area type="monotone" dataKey="deep" stroke="#B0C4BF" strokeWidth={2} fillOpacity={0} dot={{ r: 3, fill: '#B0C4BF' }} />
                        </AreaChart>
                    </ChartContainer>
                </div>

                {/* Secondary Charts Row */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Daily Steps */}
                    <ChartContainer title="Daily Steps" subtitle="Weekly step count tracking" status="9,857 avg">
                        <BarChart data={stepData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 800, fontSize: 12 }} dy={10} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: '#F8FAFB' }} content={<CustomTooltip />} />
                            <Bar dataKey="steps" fill="#602E5A" radius={[8, 8, 0, 0]} barSize={40} />
                        </BarChart>
                    </ChartContainer>

                    {/* Activity & Calories */}
                    <ChartContainer title="Activity & Calories" subtitle="Active minutes and calories burned" status="">
                        <BarChart data={activityData} barGap={12}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 800, fontSize: 12 }} dy={10} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: '#F8FAFB' }} content={<CustomTooltip />} />
                            <Bar dataKey="calories" fill="#602E5A" radius={[8, 8, 0, 0]} barSize={20} />
                            <Bar dataKey="minutes" fill="#649488" radius={[8, 8, 0, 0]} barSize={20} />
                        </BarChart>
                    </ChartContainer>
                </div>

            </main>
        </div>
    );
}

function QuickStat({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: 'rose' | 'indigo' | 'teal' | 'amber' }) {
    const variants = {
        rose: 'bg-rose-500/10 text-rose-400',
        indigo: 'bg-indigo-500/10 text-indigo-400',
        teal: 'bg-teal-500/10 text-teal-400',
        amber: 'bg-amber-500/10 text-amber-400',
    };
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-3xl flex items-center gap-4 transition-all hover:bg-white/10">
            <div className={`p-3 rounded-2xl ${variants[color]}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black text-plum-300 uppercase tracking-widest">{label}</p>
                <p className="text-lg font-black">{value}</p>
            </div>
        </div>
    );
}

function ChartContainer({ title, subtitle, status, children }: { title: string, subtitle: string, status?: string, children: any }) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-plum-800 transition-colors uppercase tracking-tight">{title}</h3>
                    <p className="text-xs font-bold text-gray-400">{subtitle}</p>
                </div>
                {status && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                        <Activity size={12} className="animate-pulse" /> {status}
                    </div>
                )}
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload, label }: { active?: boolean, payload?: any[], label?: string }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-5 rounded-[1.5rem] shadow-2xl border border-gray-50 animate-in zoom-in-95">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-50 pb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-6 py-1">
                        <span className="text-xs font-black text-gray-600 capitalize">{entry.name}:</span>
                        <span className="text-sm font-black" style={{ color: entry.stroke || entry.fill }}>
                            {entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

const hrData = [
    { name: 'Mon', avg: 72, resting: 65 },
    { name: 'Tue', avg: 75, resting: 68 },
    { name: 'Wed', avg: 70, resting: 64 },
    { name: 'Thu', avg: 78, resting: 70 },
    { name: 'Fri', avg: 74, resting: 66 },
    { name: 'Sat', avg: 68, resting: 62 },
    { name: 'Sun', avg: 71, resting: 65 },
];

const sleepData = [
    { name: 'Mon', total: 7.2, deep: 2.5 },
    { name: 'Tue', total: 8.5, deep: 3.2 },
    { name: 'Wed', total: 6.8, deep: 2.1 },
    { name: 'Thu', total: 7.5, deep: 2.8 },
    { name: 'Fri', total: 8.2, deep: 3.5 },
    { name: 'Sat', total: 9.5, deep: 4.1 },
    { name: 'Sun', total: 7.8, deep: 2.9 },
];

const stepData = [
    { name: 'Mon', steps: 8500 },
    { name: 'Tue', steps: 9200 },
    { name: 'Wed', steps: 7800 },
    { name: 'Thu', steps: 11500 },
    { name: 'Fri', steps: 10200 },
    { name: 'Sat', steps: 13500 },
    { name: 'Sun', steps: 12800 },
];

const activityData = [
    { name: 'Mon', calories: 450, minutes: 40 },
    { name: 'Tue', calories: 520, minutes: 55 },
    { name: 'Wed', calories: 480, minutes: 45 },
    { name: 'Thu', calories: 610, minutes: 65 },
    { name: 'Fri', calories: 490, minutes: 48 },
    { name: 'Sat', calories: 380, minutes: 35 },
    { name: 'Sun', calories: 550, minutes: 58 },
];

function TrendingUp(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    );
}
