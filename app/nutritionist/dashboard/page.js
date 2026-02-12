'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getNutritionist, signOut, getNutritionistPatients, getNutritionistAppointments, getDietPlans } from '@/lib/supabase';
import { Apple, Users, Calendar, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSidebar } from '@/lib/SidebarContext';
import { MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NutritionistDashboard() {
    const router = useRouter();
    const { toggle } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [nutritionist, setNutritionist] = useState(null);
    const [stats, setStats] = useState({
        totalPatients: 0,
        todayAppointments: 0,
        activePlans: 0,
        pendingConsultations: 0
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

            const { data: nutritionistData } = await getNutritionist(user.id);
            if (!nutritionistData) {
                router.push('/complete-profile');
                return;
            }

            setNutritionist(nutritionistData);

            // Fetch real data
            const today = new Date().toISOString().split('T')[0];
            const [patientsRes, apptsRes, plansRes] = await Promise.all([
                getNutritionistPatients(nutritionistData.id),
                getNutritionistAppointments(nutritionistData.id),
                getDietPlans(nutritionistData.id)
            ]);

            const patients = patientsRes.data || [];
            const appointments = apptsRes.data || [];
            const dietPlans = plansRes.data || [];

            // Calculate stats
            const uniquePatientIds = new Set(patients.map(p => p.patient_id));
            const todayAppts = appointments.filter(a => a.appointment_date === today);
            const pendingAppts = appointments.filter(a => a.status === 'pending');

            setStats({
                totalPatients: uniquePatientIds.size,
                todayAppointments: todayAppts.length,
                activePlans: dietPlans.filter(p => p.status === 'active').length,
                pendingConsultations: pendingAppts.length
            });

            // Aggregate Recent Activity
            const activity = [
                ...dietPlans.map(p => ({
                    id: `plan-${p.id}`,
                    type: 'plan',
                    title: `Diet plan "${p.title}" created for ${p.patients?.name || 'Patient'}`,
                    time: p.created_at,
                    icon: FileText,
                    color: 'purple'
                })),
                ...appointments.map(a => ({
                    id: `appt-${a.id}`,
                    type: 'appointment',
                    title: `Consultation with ${a.patients?.name || 'Patient'}`,
                    time: a.created_at,
                    icon: Calendar,
                    color: 'blue'
                }))
            ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

            setRecentActivity(activity);

            // Schedule notifications for nutritionist
            try {
                const { requestNotificationPermission, scheduleExpertAppointmentReminder, showInstantNotification } = await import('@/lib/notifications');
                const hasPermission = await requestNotificationPermission();

                if (hasPermission) {
                    // 1. Schedule reminders for today's appointments (OS level)
                    for (const apt of todayAppts) {
                        await scheduleExpertAppointmentReminder(apt);
                    }

                    // 2. Notify if there are new pending consultations (UI level, guard to prevent loop)
                    if (pendingAppts.length > 0 && !window.hasNotifiedConsultations) {
                        await showInstantNotification(
                            '🆕 New Consultations',
                            `You have ${pendingAppts.length} pending appointment requests.`
                        );
                        window.hasNotifiedConsultations = true;
                    }
                }
            } catch (notifErr) {
                console.error('Nutritionist notif error:', notifErr);
            }

        } catch (error) {
            console.error('Dashboard load error:', error);
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !nutritionist) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (nutritionist && !nutritionist.verified) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-50/30 rounded-full blur-[120px]" />
                    <div className="absolute top-[20%] -left-[10%] w-[30%] h-[50%] bg-green-50/40 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-xl w-full text-center relative z-10 space-y-8 animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl border border-green-100 flex items-center justify-center mx-auto relative overflow-hidden group">
                        <div className="absolute inset-0 bg-green-50 opacity-10 group-hover:opacity-20 transition-opacity" />
                        <Clock className="w-12 h-12 text-green-600 animate-pulse" />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                            Verification <span className="text-green-600">Pending</span>
                        </h2>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed">
                            Hello, <span className="text-green-700 font-bold">{nutritionist.name}</span>! Your professional profile is under review by our medical board.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-left">
                        {[
                            { text: "Credential validation", status: "Ongoing" },
                            { text: "Certification authenticity check", status: "Ongoing" },
                            { text: "Administrative clearance", status: "Ongoing" }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                                        <Apple className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{item.text}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50/50 px-3 py-1 rounded-full">
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] leading-loose">
                        You will be notified once your account is <br /> active for consultation practice.
                    </p>

                    <button
                        onClick={async () => { await signOut(); router.replace('/expert-login'); }}
                        className="px-10 py-4 bg-green-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-green-700/20"
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
                        <h1 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-1">Nutritionist Portal</h1>
                        <p className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight">{nutritionist?.name || 'Dashboard'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-all bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">HealthOn</span>
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold shadow-md">
                        {nutritionist?.name?.[0] || 'N'}
                    </div>
                </div>
            </header>

            <main className="w-full max-w-7xl mx-auto px-6 md:px-12 py-8 px-safe pb-24 md:pb-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome back, {nutritionist?.name?.split(' ')[0] || 'Nutritionist'}!</h2>
                    <p className="text-gray-500 font-medium">Here's what's happening with your patients today.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={Users}
                        title="Total Patients"
                        value={stats.totalPatients}
                        color="green"
                    />
                    <StatCard
                        icon={Calendar}
                        title="Today's Appointments"
                        value={stats.todayAppointments}
                        color="blue"
                    />
                    <StatCard
                        icon={FileText}
                        title="Active Diet Plans"
                        value={stats.activePlans}
                        color="purple"
                    />
                    <StatCard
                        icon={AlertCircle}
                        title="Pending Consultations"
                        value={stats.pendingConsultations}
                        color="orange"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <ActionCard
                        icon={Users}
                        title="View Patients"
                        description="Manage your patient list"
                        onClick={() => router.push('/nutritionist/patients')}
                        color="green"
                    />
                    <ActionCard
                        icon={FileText}
                        title="Diet Plans"
                        description="Create and manage diet plans"
                        onClick={() => router.push('/nutritionist/diet-plans')}
                        color="purple"
                    />
                    <ActionCard
                        icon={Calendar}
                        title="Appointments"
                        description="View and schedule appointments"
                        onClick={() => router.push('/nutritionist/appointments')}
                        color="blue"
                    />
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <p className="text-gray-400 text-sm font-bold text-center py-4">No recent activity found.</p>
                        ) : (
                            recentActivity.map((item) => (
                                <ActivityItem
                                    key={item.id}
                                    icon={item.icon}
                                    title={item.title}
                                    time={new Date(item.time).toLocaleDateString() === today ? 'Today' : new Date(item.time).toLocaleDateString()}
                                    color={item.color}
                                />
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

const StatCard = ({ icon: Icon, title, value, color }) => {
    const colors = {
        green: 'bg-green-50 text-green-600 border-green-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100'
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
        green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-900',
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
        green: 'text-green-600 bg-green-50',
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
