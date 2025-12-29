'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Share2, Save, Activity, Heart, Moon, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import Header from '@/components/patient/Header';

const data = [
    { name: 'Mon', score: 65, heart: 72 },
    { name: 'Tue', score: 68, heart: 75 },
    { name: 'Wed', score: 75, heart: 71 },
    { name: 'Thu', score: 72, heart: 73 },
    { name: 'Fri', score: 80, heart: 68 },
    { name: 'Sat', score: 85, heart: 70 },
    { name: 'Sun', score: 82, heart: 69 },
];

export default function ProgressPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-surface font-sans text-slate-900 pb-20">
            <Header userName="Nashrah" userImage={null} />

            <main className="max-w-7xl mx-auto px-6 pt-28 pb-10 space-y-8 animate-fade-in">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Health Progress</h1>
                        <p className="text-gray-500">Weekly analysis & improvement tracking</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-700 font-medium">
                            <Share2 size={18} />
                            <span>Share</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-plum-600 text-white rounded-xl hover:bg-plum-700 transition-colors shadow-lg shadow-plum-600/20 font-medium">
                            <Download size={18} />
                            <span>Download Report</span>
                        </button>
                    </div>
                </div>

                {/* Health Rating Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <RatingCard title="Overall Health Score" value="82" label="Excellent" trend="+5%" trendUp={true} color="plum" icon={Activity} />
                    <RatingCard title="Heart Health" value="98%" label="Stable" trend="+1%" trendUp={true} color="rose" icon={Heart} />
                    <RatingCard title="Sleep Quality" value="7.5h" label="Improving" trend="+0.5h" trendUp={true} color="indigo" icon={Moon} />
                    <RatingCard title="Activity Level" value="High" label="3k cal" trend="-200" trendUp={false} color="teal" icon={Zap} />
                </div>

                {/* Charts Section */}
                <div className="grid lg:grid-cols-2 gap-8">

                    {/* Weekly Health Score Trend */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-lg text-gray-900 mb-6">Health Score Trend</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#5A1B63" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#5A1B63" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#5A1B63" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Heart Rate Variability */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-lg text-gray-900 mb-6">Heart Rate Sync</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="heart" stroke="#F43F5E" strokeWidth={3} dot={{ r: 4, fill: '#F43F5E' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Watch Integration Summary */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-gray-900">Device Sync Status</h3>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">Connected</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <img src="/apple-watch-icon.png" alt="Apple Watch" className="w-8 h-8 opacity-50" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Apple Watch Series 8</h4>
                            <p className="text-gray-500 text-sm">Last synced: Just now</p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}

const RatingCard = ({ title, value, label, trend, trendUp, color, icon: Icon }) => {
    const colors = {
        plum: 'text-plum-600 bg-plum-50',
        rose: 'text-rose-600 bg-rose-50',
        indigo: 'text-indigo-600 bg-indigo-50',
        teal: 'text-teal-600 bg-teal-50',
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {trendUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                    <span className="text-sm font-medium text-gray-500">{label}</span>
                </div>
            </div>
        </div>
    );
}
