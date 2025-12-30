'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { Moon, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SleepPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sleepLog, setSleepLog] = useState({
        date: new Date().toLocaleDateString('en-CA'),
        duration: '',
        quality: 'good',
        physical_activity: 'medium',
        time_to_sleep: '',
        abnormal_lift: false
    });

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const currentUser = await getCurrentUser();
        if (!currentUser) return router.push('/login');
        setUser(currentUser);
    };

    const saveSleep = async () => {
        try {
            const { error } = await supabase.from('sleep_logs').insert([{
                patient_id: user.id,
                ...sleepLog
            }]);

            if (error) throw error;
            toast.success('Sleep logged successfully!');
            setSleepLog({
                date: new Date().toLocaleDateString('en-CA'),
                duration: '',
                quality: 'good',
                physical_activity: 'medium',
                time_to_sleep: '',
                abnormal_lift: false
            });
        } catch (error) {
            toast.error('Error saving sleep log');
        }
    };

    return (
        <div className="min-h-screen bg-surface pb-20">
            <header className="bg-white border-b">
                <div className="container mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Sleep Tracking</h1>
                        <p className="text-sm text-gray-500">Monitor your sleep patterns</p>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 max-w-2xl">
                <div className="bg-white p-6 rounded-3xl shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">Date</label>
                        <input
                            type="date"
                            value={sleepLog.date}
                            onChange={(e) => setSleepLog({ ...sleepLog, date: e.target.value })}
                            className="w-full px-4 py-3 border rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Sleep Duration (hours)</label>
                        <input
                            type="number"
                            step="0.5"
                            value={sleepLog.duration}
                            onChange={(e) => setSleepLog({ ...sleepLog, duration: e.target.value })}
                            placeholder="e.g., 7.5"
                            className="w-full px-4 py-3 border rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Sleep Quality</label>
                        <select
                            value={sleepLog.quality}
                            onChange={(e) => setSleepLog({ ...sleepLog, quality: e.target.value })}
                            className="w-full px-4 py-3 border rounded-xl"
                        >
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Physical Activity Level</label>
                        <select
                            value={sleepLog.physical_activity}
                            onChange={(e) => setSleepLog({ ...sleepLog, physical_activity: e.target.value })}
                            className="w-full px-4 py-3 border rounded-xl"
                        >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Time to Fall Asleep (minutes)</label>
                        <input
                            type="number"
                            value={sleepLog.time_to_sleep}
                            onChange={(e) => setSleepLog({ ...sleepLog, time_to_sleep: e.target.value })}
                            placeholder="e.g., 15"
                            className="w-full px-4 py-3 border rounded-xl"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={sleepLog.abnormal_lift}
                            onChange={(e) => setSleepLog({ ...sleepLog, abnormal_lift: e.target.checked })}
                            className="w-5 h-5"
                        />
                        <label className="font-medium">Abnormal Lift After Waking Up</label>
                    </div>

                    <button
                        onClick={saveSleep}
                        className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Save Sleep Log
                    </button>
                </div>
            </div>
        </div>
    );
}
