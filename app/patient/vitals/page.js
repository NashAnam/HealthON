'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, saveVitals } from '@/lib/supabase';
import { Activity, Heart, Scale, Ruler, Droplet, Save, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VitalsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [patient, setPatient] = useState(null);
    const [vitals, setVitals] = useState({
        heart_rate: '',
        systolic_bp: '',
        diastolic_bp: '',
        blood_sugar: '',
        weight: '',
        height: ''
    });

    useEffect(() => {
        loadPatient();
    }, []);

    const loadPatient = async () => {
        const user = await getCurrentUser();
        if (!user) return router.replace('/login');
        const { data } = await getPatient(user.id);
        setPatient(data);
    };

    const handleSubmit = async () => {
        if (!patient) return;

        // Basic validation
        if (!vitals.heart_rate && !vitals.systolic_bp && !vitals.weight && !vitals.blood_sugar) {
            toast.error('Please enter at least one value');
            return;
        }

        setLoading(true);
        try {
            // Convert strings to numbers
            const numericVitals = {
                heart_rate: vitals.heart_rate ? parseInt(vitals.heart_rate) : null,
                systolic_bp: vitals.systolic_bp ? parseInt(vitals.systolic_bp) : null,
                diastolic_bp: vitals.diastolic_bp ? parseInt(vitals.diastolic_bp) : null,
                blood_sugar: vitals.blood_sugar ? parseInt(vitals.blood_sugar) : null,
                weight: vitals.weight ? parseFloat(vitals.weight) : null,
                height: vitals.height ? parseFloat(vitals.height) : null,
            };

            const { error } = await saveVitals(patient.id, numericVitals);
            if (error) throw error;

            toast.success('Vitals logged successfully!');
            router.push('/patient/dashboard');

        } catch (error) {
            console.error('Error saving vitals:', error.message || error);
            console.error('Full error object:', error);
            toast.error(error.message || 'Failed to save vitals. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!patient) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-900">
            <div className="max-w-lg mx-auto">

                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                        <ChevronLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">Log Vitals</h1>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">

                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-rose-500" /> Heart Rate
                        </h2>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="72"
                                value={vitals.heart_rate}
                                onChange={e => setVitals({ ...vitals, heart_rate: e.target.value })}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">BPM</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" /> Blood Pressure
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="120"
                                    value={vitals.systolic_bp}
                                    onChange={e => setVitals({ ...vitals, systolic_bp: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Sys</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="80"
                                    value={vitals.diastolic_bp}
                                    onChange={e => setVitals({ ...vitals, diastolic_bp: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Dia</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Droplet className="w-5 h-5 text-emerald-500" /> Blood Sugar
                        </h2>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="100"
                                value={vitals.blood_sugar}
                                onChange={e => setVitals({ ...vitals, blood_sugar: e.target.value })}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">mg/dL</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-violet-500" /> Weight
                            </h2>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="70"
                                    value={vitals.weight}
                                    onChange={e => setVitals({ ...vitals, weight: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">kg</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Ruler className="w-5 h-5 text-violet-500" /> Height
                            </h2>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="170"
                                    value={vitals.height}
                                    onChange={e => setVitals({ ...vitals, height: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">cm</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 mt-8 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Vitals'}
                        {!loading && <Save className="w-5 h-5" />}
                    </button>

                </div>
            </div>
        </div>
    );
}
