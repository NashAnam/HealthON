'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase';
import { Activity, Utensils, Moon, Target, TrendingUp, Users, ArrowLeft } from 'lucide-react';

export default function HealthTrackerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const currentUser = await getCurrentUser();
        if (!currentUser) return router.push('/login');
        setUser(currentUser);
        setLoading(false);
    };

    const features = [
        {
            title: 'Diet Tracking',
            description: 'Log meals, calories, and vitamins',
            icon: Utensils,
            color: 'from-orange-500 to-red-500',
            route: '/patient/diet'
        },
        {
            title: 'Sleep Tracking',
            description: 'Monitor sleep quality and patterns',
            icon: Moon,
            color: 'from-indigo-500 to-purple-500',
            route: '/patient/sleep'
        },
        {
            title: 'Goals',
            description: 'Set and track health goals',
            icon: Target,
            color: 'from-green-500 to-teal-500',
            route: '/patient/goals'
        },
        {
            title: 'Progress Reports',
            description: 'View weekly health analysis',
            icon: TrendingUp,
            color: 'from-blue-500 to-cyan-500',
            route: '/patient/progress'
        },
        {
            title: 'Reminders',
            description: 'Manage health reminders',
            icon: Activity,
            color: 'from-pink-500 to-rose-500',
            route: '/patient/reminders'
        },
        {
            title: 'Network',
            description: 'Connect and share progress',
            icon: Users,
            color: 'from-purple-500 to-pink-500',
            route: '/patient/network'
        }
    ];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plum-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface font-sans text-slate-900 pb-20">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/patient/dashboard')}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Health Tracker</h1>
                            <p className="text-sm text-gray-500">Track your wellness journey</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                onClick={() => router.push(feature.route)}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 text-sm">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
