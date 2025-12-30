'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    getPatient,
    getDoctor,
    getLatestVitals,
    getPatientAppointments,
    getLatestAssessment,
    createVitals,
    signOut,
    supabase
} from '@/lib/supabase';
import toast from 'react-hot-toast';
import {
    Activity, Calendar, FileText, ChevronRight, Heart, Footprints, Flame, Timer, Search, Bell, User, LogOut, ChevronDown, Watch, Microscope, Users, Plus, Zap, MoreHorizontal
} from 'lucide-react';
// ... imports
import { useSidebar } from '@/lib/SidebarContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

function DashboardHeader({ patient }) {
    const router = useRouter();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { toggle } = useSidebar();

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="flex items-center justify-between mb-8 relative z-[90]">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Welcome back, <span className="text-plum-800">{patient?.name?.split(' ')[0] || 'User'}</span>!</h1>
                <p className="text-gray-500 font-medium">Here's your health overview for today. Stay active and healthy! 👋</p>
            </div>

            <div className="flex items-center gap-4">
                {/* Sidebar Toggle - BESIDE PROFILE */}
                <button
                    onClick={toggle}
                    className="p-3 bg-white text-plum-900 rounded-full shadow-sm border border-gray-100 active:scale-95 transition-all hover:bg-plum-50"
                >
                    <MoreHorizontal size={24} />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-4 hover:opacity-80 transition-all cursor-pointer z-[95] bg-white p-2 pr-4 rounded-2xl border border-gray-100 shadow-sm"
                    >
                        <div className="w-12 h-12 rounded-full bg-plum-100 flex items-center justify-center text-plum-800 font-black border-2 border-white shadow-sm overflow-hidden text-xl">
                            {patient?.name?.[0] || 'N'}
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-black text-gray-900 leading-none mb-1">{patient?.name || 'User Profile'}</p>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Verified Patient</p>
                                <span className="w-1 h-1 rounded-full bg-teal-200"></span>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secure Profile</p>
                            </div>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-50 py-2 z-[999] animate-in fade-in slide-in-from-top-2">
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-3 transition-colors">
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PatientDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [vitals, setVitals] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [isConnectingWatch, setIsConnectingWatch] = useState(false);
    const [activeTab, setActiveTab] = useState('weekly');
    const [showManualLog, setShowManualLog] = useState(false);
    const [manualEntry, setManualEntry] = useState({ bp_sys: '', bp_dia: '', sugar: '' });
    const [assessment, setAssessment] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return router.push('/login');

            const { data: patientData } = await getPatient(user.id);
            if (!patientData) {
                const { data: doctorData } = await getDoctor(user.id);
                if (doctorData) {
                    toast.error('Access restricted: You are registered as a Doctor.');
                    return router.push('/doctor/dashboard');
                }
                return router.push('/complete-profile');
            }

            const [vitalsData, appointmentsData, assessmentData, historyData] = await Promise.all([
                getLatestVitals(patientData.id).then(res => res.data),
                getPatientAppointments(patientData.id).then(res => res.data),
                getLatestAssessment(patientData.id).then(res => res.data),
                supabase.from('vitals').select('*').eq('patient_id', patientData.id).order('recorded_at', { ascending: false }).limit(7).then(res => res.data)
            ]);

            setPatient(patientData);
            setVitals(vitalsData);
            setAppointments(appointmentsData || []);
            setAssessment(assessmentData);
            setHistory(historyData ? historyData.reverse() : []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const connectWatch = async () => {
        if (!patient) return toast.error('Please wait for profile to load');
        setIsConnectingWatch(true);
        const tid = toast.loading('Syncing with SmartWatch...');
        await new Promise(r => setTimeout(r, 2000));

        const mockVitals = {
            patient_id: patient.id,
            user_id: patient.user_id,
            heart_rate: 72,
            sleep_hours: 7.5,
            steps: 8500,
            calories: 450,
            active_minutes: 45,
            recorded_at: new Date().toISOString()
        };

        const { data, error } = await createVitals(mockVitals);
        if (!error) {
            setVitals(data);
            toast.success('Health data synced!', { id: tid });
            loadDashboard(); // Refresh dashboard to show new vitals in history
        } else {
            toast.error('Sync failed', { id: tid });
        }
        setIsConnectingWatch(false);
    };

    const handleManualLog = async (e) => {
        e.preventDefault();
        if (!patient) return;
        const tid = toast.loading('Saving vitals...');

        const newVitals = {
            patient_id: patient.id,
            user_id: patient.user_id,
            heart_rate: null,
            systolic_bp: parseInt(manualEntry.bp_sys),
            diastolic_bp: parseInt(manualEntry.bp_dia),
            blood_sugar: parseInt(manualEntry.sugar),
            recorded_at: new Date().toISOString()
        };

        const { data, error } = await createVitals(newVitals);
        if (!error) {
            setVitals(data);
            toast.success('Logged successfully!', { id: tid });
            setShowManualLog(false);
            setManualEntry({ bp_sys: '', bp_dia: '', sugar: '' });
            // Refresh history
            loadDashboard();
        } else {
            console.error('Save error:', error);
            toast.error('Failed to save: ' + error.message, { id: tid });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]"><div className="w-12 h-12 border-4 border-plum-200 border-t-plum-800 rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] p-4 md:p-8 font-sans text-slate-900 relative overflow-hidden">
            {/* Dynamic Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-plum-100/40 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-teal-50/40 rounded-full blur-[100px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-blue-50/40 rounded-full blur-[100px]" />
            </div>

            <DashboardHeader patient={patient} />

            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <ActionCard
                    icon={Watch}
                    title="Connect Watch"
                    subtitle="Sync your health data"
                    onClick={connectWatch}
                    color="bg-plum-800"
                    active={isConnectingWatch}
                />
                <ActionCard
                    icon={Activity}
                    title="Health Assessment"
                    subtitle="Get your risk score"
                    onClick={() => router.push('/patient/assessment')}
                    color="bg-teal-500"
                />
                <ActionCard
                    icon={Zap}
                    title="7-Day Action Plan"
                    subtitle="Personalised Health Journey"
                    onClick={() => router.push(assessment ? '/patient/action-plan' : '/patient/assessment')}
                    color="bg-emerald-600"
                />
                <ActionCard
                    icon={Activity}
                    title="Track My Treatment"
                    subtitle="Goals & Nutrition"
                    onClick={() => router.push('/patient/goals')}
                    color="bg-indigo-600"
                />
            </div>

            {/* Daily Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatTile icon={Heart} label="Heart Rate" value={vitals?.heart_rate ? `${vitals.heart_rate} bpm` : '--'} subtitle="Latest Record" color="rose" progress={vitals?.heart_rate ? Math.min((vitals.heart_rate / 200) * 100, 100) : 0} />
                <StatTile icon={Timer} label="Sleep" value={vitals?.sleep_hours ? `${vitals.sleep_hours} h` : '--'} subtitle="Latest Record" color="indigo" progress={vitals?.sleep_hours ? Math.min((vitals.sleep_hours / 12) * 100, 100) : 0} />
                <StatTile icon={Footprints} label="Steps Today" value={vitals?.steps ? vitals.steps.toLocaleString() : '--'} subtitle="Daily Goal: 10k" color="plum" progress={vitals?.steps ? Math.min((vitals.steps / 10000) * 100, 100) : 0} />
                <StatTile icon={Activity} label="Active Minutes" value={vitals?.active_minutes ? `${vitals.active_minutes} min` : '--'} subtitle="Today" color="teal" progress={vitals?.active_minutes ? Math.min((vitals.active_minutes / 180) * 100, 100) : 0} />
            </div>

            {/* Bookings Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <ActionCard
                    icon={Calendar}
                    title="Book Appointment"
                    subtitle="Schedule with specialists"
                    onClick={() => router.push('/patient/doctor-booking')}
                    color="bg-teal-600"
                />
                <ActionCard
                    icon={Microscope}
                    title="Book Lab Test"
                    subtitle="Diagnostics & Screenings"
                    onClick={() => router.push('/patient/reports?tab=labs')}
                    color="bg-plum-700"
                />
            </div>

            {/* Trends Section */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-10">
                <div className="flex items-center justify-between mb-8 overflow-x-auto">
                    <div className="flex gap-2">
                        {['weekly', 'heart', 'sleep', 'activity'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-plum-800 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                {tab === 'weekly' ? 'Weekly Overview' : tab === 'heart' ? 'Heart Rate' : tab === 'sleep' ? 'Sleep' : 'Activity'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowManualLog(true)}
                        className="flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-600 border-2 border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm hover:shadow-md"
                    >
                        <Plus size={18} /> Add Manual Vitals
                    </button>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {history.length > 0 ? (
                            activeTab === 'weekly' || activeTab === 'heart' ? (
                                <AreaChart data={history.map(h => ({ name: new Date(h.recorded_at).toLocaleDateString('en-US', { weekday: 'short' }), value: h.heart_rate, value2: h.systolic_bp }))}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#602E5A" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#602E5A" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 800, fontSize: 12 }} dy={10} />
                                    <YAxis hide />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" name="Heart Rate" stroke="#602E5A" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 4, fill: '#602E5A', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                    <Area type="monotone" dataKey="value2" name="BP Sys" stroke="#649488" strokeWidth={2} fillOpacity={0} dot={{ r: 3, fill: '#649488' }} />
                                </AreaChart>
                            ) : activeTab === 'activity' ? (
                                <BarChart data={history.map(h => ({ name: new Date(h.recorded_at).toLocaleDateString('en-US', { weekday: 'short' }), calories: h.calories, minutes: h.active_minutes }))} barGap={8}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 800, fontSize: 12 }} dy={10} />
                                    <YAxis hide />
                                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                    <Bar dataKey="calories" name="Calories" fill="#602E5A" radius={[4, 4, 0, 0]} barSize={12} />
                                    <Bar dataKey="minutes" name="Minutes" fill="#649488" radius={[4, 4, 0, 0]} barSize={12} />
                                </BarChart>
                            ) : (
                                <AreaChart data={history.map(h => ({ name: new Date(h.recorded_at).toLocaleDateString('en-US', { weekday: 'short' }), value: h.sleep_hours }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 800, fontSize: 12 }} dy={10} />
                                    <YAxis hide />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" name="Sleep Hours" stroke="#649488" strokeWidth={4} fill="#64948833" dot={{ r: 4, fill: '#649488' }} />
                                </AreaChart>
                            )
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Activity size={48} className="mb-4 opacity-20" />
                                <p className="font-bold">No historical data found</p>
                                <p className="text-xs">Sync your watch or log vitals to see trends</p>
                            </div>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Health Tip Section */}
            <HealthTipSection assessment={assessment} />

            {/* Manual Log Modal */}
            {showManualLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                            <Plus className="text-teal-600" /> Manual Entry
                        </h3>
                        <form onSubmit={handleManualLog} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="BP Sys (mmHg)" placeholder="120" value={manualEntry.bp_sys} onChange={v => setManualEntry({ ...manualEntry, bp_sys: v })} />
                                <FormInput label="BP Dia (mmHg)" placeholder="80" value={manualEntry.bp_dia} onChange={v => setManualEntry({ ...manualEntry, bp_dia: v })} />
                            </div>
                            <FormInput label="Sugar Level (mg/dL)" placeholder="95" value={manualEntry.sugar} onChange={v => setManualEntry({ ...manualEntry, sugar: v })} />

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowManualLog(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-plum-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-plum-800/20">Save Logs</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionCard({ icon: Icon, title, subtitle, onClick, color, active, fullWidth }) {
    return (
        <button
            onClick={onClick}
            className={`p-6 rounded-[2rem] text-left transition-all hover:translate-y-[-4px] active:scale-95 group relative overflow-hidden ${active ? 'opacity-50 pointer-events-none' : ''} bg-white border border-gray-100 shadow-sm hover:shadow-xl ${fullWidth ? 'w-full' : ''}`}
        >
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-4 rounded-2xl ${active ? 'bg-gray-100 text-gray-400' : color + ' text-white shadow-lg'} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h4 className="font-black text-gray-900">{title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{subtitle}</p>
                </div>
                <ChevronRight className="ml-auto text-gray-300 group-hover:text-plum-800 group-hover:translate-x-1 transition-all" size={20} />
            </div>
        </button>
    );
}

function HealthTipSection({ assessment }) {
    const tips = [
        "Stay hydrated! Drinking 8 glasses of water daily helps maintain energy levels and supports overall health.",
        "A 30-minute brisk walk daily can significantly reduce cardiovascular risk and improve mood.",
        "Quality sleep (7-9 hours) is essential for metabolic health and cognitive function.",
        "Adding more fiber to your diet helps stabilize blood sugar and improves digestion.",
        "Managing stress through deep breathing or meditation can lower blood pressure naturally."
    ];

    const specificTips = [];
    if (assessment?.scores) {
        const s = assessment.scores;
        if (s.diabetes > 30) specificTips.push("Replacing refined carbs with whole grains can help manage your glucose levels effectively.");
        if (s.hypertension > 4) specificTips.push("Reducing salt intake to less than 5g daily is a key step in managing blood pressure.");
        if (s.thyroid > 5) specificTips.push("Consistent medication timing is crucial for maintaining stable thyroid hormone levels.");
    }

    const allTips = [...tips, ...specificTips];
    const [tip, setTip] = useState(allTips[0]);

    useEffect(() => {
        const randomTip = allTips[Math.floor(Math.random() * allTips.length)];
        setTip(randomTip);
    }, [assessment]);

    return (
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-teal-900/10 mb-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            <div className="relative z-10 max-w-2xl">
                <h3 className="text-2xl font-black mb-3">Health Tip of the Day</h3>
                <p className="text-teal-50 font-medium leading-relaxed">
                    {tip}
                </p>
            </div>
        </div>
    );
}

function StatTile({ icon: Icon, label, value, subtitle, color, progress = 65 }) {
    const variants = {
        rose: 'text-rose-500 bg-rose-50',
        indigo: 'text-indigo-500 bg-indigo-50',
        plum: 'text-plum-700 bg-plum-50',
        teal: 'text-teal-600 bg-teal-50',
    };
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{label}</h4>
                    <p className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1 group-hover:text-plum-800 transition-colors">{value}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${variants[color]} group-hover:scale-110 transition-transform`}>
                    <Icon size={22} />
                </div>
            </div>
            <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${variants[color].split(' ')[0].replace('text-', 'bg-')}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

function FormInput({ label, placeholder, value, onChange }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <input
                type="number"
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-plum-800/20 focus:bg-white transition-all"
            />
        </div>
    );
}


function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm font-black" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
}
