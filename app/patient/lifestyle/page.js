'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/patient/Header';
import { Utensils, Moon, Zap, Target, Plus } from 'lucide-react';

export default function LifestyleDashboard() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-surface">
            <Header userName="Nashrah" userImage={null} />
            <main className="max-w-7xl mx-auto px-6 pt-28 pb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Lifestyle Tracker</h1>

                <div className="grid md:grid-cols-3 gap-6">
                    <div onClick={() => router.push('/patient/lifestyle/diet')} className="glass-card p-6 cursor-pointer hover:shadow-lg transition-all">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                            <Utensils size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Diet Plan</h3>
                        <p className="text-sm text-gray-500 mt-1">Track calories & meals</p>
                    </div>

                    <div onClick={() => router.push('/patient/lifestyle/sleep')} className="glass-card p-6 cursor-pointer hover:shadow-lg transition-all">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                            <Moon size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Sleep Monitor</h3>
                        <p className="text-sm text-gray-500 mt-1">Analyze sleep patterns</p>
                    </div>

                    <div onClick={() => router.push('/patient/lifestyle/activity')} className="glass-card p-6 cursor-pointer hover:shadow-lg transition-all">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Physical Activity</h3>
                        <p className="text-sm text-gray-500 mt-1">Steps, workouts & energy</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
