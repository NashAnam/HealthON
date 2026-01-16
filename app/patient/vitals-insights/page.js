'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, supabase } from '@/lib/supabase';
import { Activity, Heart, TrendingUp, TrendingDown, Calendar, ArrowLeft, Droplets, Thermometer, Wind, Weight } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function VitalsVisualizationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [vitalsData, setVitalsData] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState('heart_rate');
    const [assessment, setAssessment] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const user = await getCurrentUser();
        if (!user) return router.replace('/login');

        const { data: patientData } = await getPatient(user.id);
        if (!patientData) {
            setLoading(false);
            return;
        }
        setPatient(patientData);

        // Fetch last 30 days of vitals
        const { data: vitals } = await supabase
            .from('vitals')
            .select('*')
            .eq('patient_id', patientData.id)
            .order('recorded_at', { ascending: false })
            .limit(30);

        if (vitals) {
            const formatted = vitals.reverse().map(v => ({
                date: v.recorded_at ? new Date(v.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
                heart_rate: v.heart_rate,
                systolic_bp: v.systolic_bp,
                diastolic_bp: v.diastolic_bp,
                blood_sugar: v.blood_sugar,
                weight: v.weight,
                temperature: v.temperature || 98.6,
                respiratory_rate: v.respiratory_rate || 16,
                bmi: v.weight && v.height ? (v.weight / ((v.height / 100) ** 2)).toFixed(1) : null
            }));
            setVitalsData(formatted);
        }

        const { data: latestAssessment } = await supabase
            .from('health_assessments')
            .select('*')
            .eq('patient_id', patientData.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        setAssessment(latestAssessment);

        setLoading(false);
    };

    const getLatestValue = (metric) => {
        if (vitalsData.length === 0) return '--';
        const latest = vitalsData[vitalsData.length - 1];
        return latest[metric] || '--';
    };

    const getTrend = (metric) => {
        if (vitalsData.length < 2) return 0;
        const latest = vitalsData[vitalsData.length - 1][metric];
        const previous = vitalsData[vitalsData.length - 2][metric];
        if (!latest || !previous) return 0;
        return latest - previous;
    };

    const metrics = [
        { key: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', color: '#f59e0b', icon: Droplets, gradient: ['#fef3c7', '#f59e0b'] },
        { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', color: '#ef4444', icon: Heart, gradient: ['#fee2e2', '#ef4444'] },
        { key: 'systolic_bp', label: 'Blood Pressure', unit: 'mmHg', color: '#06b6d4', icon: Activity, gradient: ['#cffafe', '#06b6d4'] },
        { key: 'temperature', label: 'Body Temp', unit: '°F', color: '#f43f5e', icon: Thermometer, gradient: ['#ffe4e6', '#f43f5e'] },
        { key: 'respiratory_rate', label: 'Resp. Rate', unit: 'rpm', color: '#8b5cf6', icon: Wind, gradient: ['#ede9fe', '#8b5cf6'] },
    ];

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5D2A42]"></div></div>;

    return (
        <div className="min-h-screen bg-white p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Health Overview</h1>
                        <p className="text-slate-500 mt-1">
                            Name: <span className="font-semibold text-slate-900">{patient?.name}</span> •
                            Age: <span className="font-semibold text-slate-900">{patient?.age}</span>
                        </p>
                    </div>
                    <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                </div>



                {/* Metric Cards Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {metrics.map(metric => {
                        const trend = getTrend(metric.key);
                        const Icon = metric.icon;
                        const isSelected = selectedMetric === metric.key;

                        return (
                            <button
                                key={metric.key}
                                onClick={() => setSelectedMetric(metric.key)}
                                className={`relative overflow-hidden p-5 rounded-[24px] transition-all duration-300 text-left group ${isSelected
                                    ? 'bg-teal-600 text-white shadow-xl shadow-teal-600/20 scale-105 z-10'
                                    : 'bg-white text-slate-900 shadow-sm border-2 border-slate-100 hover:shadow-md hover:border-teal-100'
                                    }`}
                            >
                                <div className="flex flex-col h-full justify-between">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-slate-50'}`}>
                                            <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                        </div>
                                        {trend !== 0 && (
                                            <div className={`flex items-center gap-0.5 text-[10px] font-bold ${isSelected ? 'text-white' : (trend > 0 ? 'text-amber-500' : 'text-teal-500')}`}>
                                                {trend > 0 ? '+' : ''}{trend.toFixed(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-medium mb-1 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>{metric.label}</p>
                                        <p className="text-xl font-bold tracking-tight">
                                            {getLatestValue(metric.key)}
                                            <span className={`text-xs font-normal ml-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{metric.unit}</span>
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Main Charts Area */}
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Main Large Chart */}
                    <div className="md:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{metrics.find(m => m.key === selectedMetric)?.label} History</h3>
                                <p className="text-sm text-slate-500">Last 30 days trends</p>
                            </div>
                            <div className="flex gap-2">
                                {['1W', '1M', '3M', '1Y'].map(period => (
                                    <button
                                        key={period}
                                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${period === '1M'
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={vitalsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={metrics.find(m => m.key === selectedMetric)?.color} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={metrics.find(m => m.key === selectedMetric)?.color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            color: '#0f172a',
                                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'
                                        }}
                                        itemStyle={{ color: '#0f172a' }}
                                        labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={selectedMetric}
                                        stroke={metrics.find(m => m.key === selectedMetric)?.color}
                                        strokeWidth={4}
                                        fill="url(#colorMain)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Secondary Chart / Stats */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Risk Pattern Analysis</h3>
                                <p className="text-slate-500 text-sm mb-6">Non-diagnostic assessment</p>
                                {assessment ? (
                                    <>
                                        <div className="space-y-4">
                                            {Object.entries(assessment.scores).map(([key, score]) => (
                                                <div key={key} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{key} Pattern</span>
                                                    <span className={`text-xs font-black uppercase tracking-wider ${score > 50 ? 'text-amber-600' : score > 20 ? 'text-blue-600' : 'text-teal-600'}`}>
                                                        {score > 50 ? 'Attention' : score > 20 ? 'Moderate' : 'Stable'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => router.push('/patient/assessment/result')}
                                            className="w-full mt-6 py-3 bg-teal-50 text-teal-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-teal-100 transition-all"
                                        >
                                            View Safe Report
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-slate-400 text-sm">No assessment data</p>
                                        <button
                                            onClick={() => router.push('/patient/assessment')}
                                            className="mt-4 text-teal-600 font-bold hover:underline text-sm"
                                        >
                                            Start Assessment
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4">Activity Log</h3>
                            <div className="space-y-4">
                                {vitalsData.length > 0 ? vitalsData.slice(0, 3).map((vital, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs">
                                            {vital.date.split(' ')[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Vitals Logged</p>
                                            <p className="text-xs text-slate-500">{vital.date}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
