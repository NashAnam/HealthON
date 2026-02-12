'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPhysiotherapist, signOut, getPhysiotherapistPatients, getPhysiotherapistAppointments, getExercisePlans } from '@/lib/supabase';
import { Activity, Users, Calendar, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSidebar } from '@/lib/SidebarContext';
import { MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PhysiotherapistDashboard() {
    const router = useRouter();
    const { toggle } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [physiotherapist, setPhysiotherapist] = useState(null);
    const [stats, setStats] = useState({
        totalPatients: 0,
        todaySessions: 0,
        activePrograms: 0,
        pendingAssessments: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) {
                router.push('/expert-login');
                return;
            }

            const { data: physiotherapistData } = await getPhysiotherapist(user.id);
            if (!physiotherapistData) {
                router.push('/complete-profile');
                return;
            }

            setPhysiotherapist(physiotherapistData);

            // Fetch real data
            const today = new Date().toISOString().split('T')[0];
            const [patientsRes, apptsRes, plansRes] = await Promise.all([
                getPhysiotherapistPatients(physiotherapistData.id),
                getPhysiotherapistAppointments(physiotherapistData.id),
                getExercisePlans(physiotherapistData.id)
            ]);

            const patients = patientsRes.data || [];
            const appointments = apptsRes.data || [];
            const exercisePlans = plansRes.data || [];

            // Calculate stats
            const uniquePatientIds = new Set(patients.map(p => p.patient_id));
            const todayAppts = appointments.filter(a => a.appointment_date === today);
            const pendingAppts = appointments.filter(a => a.status === 'pending');

            setStats({
                totalPatients: uniquePatientIds.size,
                todaySessions: todayAppts.length,
                activePrograms: exercisePlans.length,
                pendingAssessments: pendingAppts.length
            });

            // Aggregate Recent Activity
            const activity = [
                ...exercisePlans.map(p => ({
                    id: `plan-${p.id}`,
                    type: 'plan',
                    title: `Exercise plan "${p.title}" created for ${p.patients?.name || 'Patient'}`,
                    time: p.created_at,
                    icon: FileText,
                    color: 'purple'
                })),
                ...appointments.map(a => ({
                    id: `appt-${a.id}`,
                    type: 'appointment',
                    title: `Session with ${a.patients?.name || 'Patient'}`,
                    time: a.created_at,
                    icon: Calendar,
                    color: 'blue'
                }))
            ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

            setRecentActivity(activity);

            // Schedule notifications for physiotherapist
            try {
                const { requestNotificationPermission, scheduleExpertAppointmentReminder, showInstantNotification } = await import('@/lib/notifications');
                const hasPermission = await requestNotificationPermission();

                if (hasPermission) {
                    // 1. Schedule reminders for today's sessions (OS level)
                    for (const apt of todayAppts) {
                        await scheduleExpertAppointmentReminder(apt);
                    }

                    // 2. Notify if there are new pending assessments/sessions (UI level, guard to prevent loop)
                    if (pendingAppts.length > 0 && !window.hasNotifiedSessions) {
                        await showInstantNotification(
                            '🆕 New Session Requests',
                            `You have ${pendingAppts.length} pending session requests.`
                        );
                        window.hasNotifiedSessions = true;
                    }
                }
            } catch (notifErr) {
                console.error('Physio notif error:', notifErr);
            }

        } catch (error) {
            console.error('Dashboard load error:', error);
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !physiotherapist) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (physiotherapist && !physiotherapist.verified) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-orange-50/30 rounded-full blur-[120px]" />
                    <div className="absolute top-[20%] -left-[10%] w-[30%] h-[50%] bg-orange-50/40 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-xl w-full text-center relative z-10 space-y-8 animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl border border-orange-100 flex items-center justify-center mx-auto relative overflow-hidden group">
                        <div className="absolute inset-0 bg-orange-50 opacity-10 group-hover:opacity-20 transition-opacity" />
                        <Clock className="w-12 h-12 text-orange-600 animate-pulse" />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                            Verification <span className="text-orange-600">Pending</span>
                        </h2>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed">
                            Hello, <span className="text-orange-700 font-bold">{physiotherapist.name}</span>! Your professional profile is under review by our medical board.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-left">
                        {[
                            { text: "Credential validation", status: "Ongoing" },
                            { text: "License authenticity check", status: "Ongoing" },
                            { text: "Administrative clearance", status: "Ongoing" }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                                        <Activity className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{item.text}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50/50 px-3 py-1 rounded-full">
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] leading-loose">
                        You will be notified once your account is <br /> active for therapy practice.
                    </p>

                    <button
                        onClick={async () => { await signOut(); router.replace('/expert-login'); }}
                        className="px-10 py-4 bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-orange-700/20"
                    >
                        Logout to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white px-6 md:px-12 pt-4 pb-5 md:py-6 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50 pt-safe px-safe min-h-[env(safe-area-inset-top)+64px]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggle}
                        className="lg:hidden p-2 -ml-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <MoreVertical className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-1">Physiotherapist Portal</h1>
                        <p className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight">{physiotherapist?.name || 'Dashboard'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-all bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">HealthOn</span>
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold shadow-md">
                        {physiotherapist?.name?.[0] || 'P'}
                    </div>
                </div>
            </header>

            <main className="w-full max-w-7xl mx-auto px-6 md:px-12 py-8 px-safe pb-24 md:pb-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome back, {physiotherapist?.name?.split(' ')[0] || 'Physiotherapist'}!</h2>
                    <p className="text-gray-500 font-medium">Here's what's happening with your patients today.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={Users}
                        title="Total Patients"
                        value={stats.totalPatients}
                        color="orange"
                    />
                    <StatCard
                        icon={Calendar}
                        title="Today's Sessions"
                        value={stats.todaySessions}
                        color="blue"
                    />
                    <StatCard
                        icon={FileText}
                        title="Active Programs"
                        value={stats.activePrograms}
                        color="purple"
                    />
                    <StatCard
                        icon={AlertCircle}
                        title="Pending Assessments"
                        value={stats.pendingAssessments}
                        color="red"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <ActionCard
                        icon={Users}
                        title="View Patients"
                        description="Manage your patient list"
                        onClick={() => router.push('/physiotherapist/patients')}
                        color="orange"
                    />
                    <ActionCard
                        icon={FileText}
                        title="Exercise Plans"
                        description="Create and manage exercise programs"
                        onClick={() => router.push('/physiotherapist/exercise-plans')}
                        color="purple"
                    />
                    <ActionCard
                        icon={Calendar}
                        title="Sessions"
                        description="View and schedule therapy sessions"
                        onClick={() => router.push('/physiotherapist/sessions')}
                        color="blue"
                    />
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">Recent Activity</h3>
                    <div className="space-y-4">
                        <ActivityItem
                            icon={CheckCircle2}
                            title="Exercise plan created for John Davis"
                            time="1 hour ago"
                            color="orange"
                        />
                        <ActivityItem
                            icon={Calendar}
                            title="Therapy session completed with Lisa Brown"
                            time="3 hours ago"
                            color="blue"
                        />
                        <ActivityItem
                            icon={FileText}
                            title="Progress assessment reviewed for Tom Wilson"
                            time="Yesterday"
                            color="purple"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

const StatCard = ({ icon: Icon, title, value, color }) => {
    const colors = {
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        red: 'bg-red-50 text-red-600 border-red-100'
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-3xl font-black text-gray-900">{value}</p>
        </div>
    );
};

const ActionCard = ({ icon: Icon, title, description, onClick, color }) => {
    const colors = {
        orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-900',
        blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900',
        purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
    };

    return (
        <button
            onClick={onClick}
            className={`p-6 rounded-2xl border transition-all text-left hover:shadow-lg ${colors[color]}`}
        >
            <Icon className="w-8 h-8 mb-4" />
            <h4 className="text-lg font-black mb-2">{title}</h4>
            <p className="text-sm font-medium opacity-70">{description}</p>
        </button>
    );
};

const ActivityItem = ({ icon: Icon, title, time, color }) => {
    const colors = {
        orange: 'text-orange-600 bg-orange-50',
        blue: 'text-blue-600 bg-blue-50',
        purple: 'text-purple-600 bg-purple-50'
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <p className="font-bold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{time}</p>
            </div>
        </div>
    );
};
