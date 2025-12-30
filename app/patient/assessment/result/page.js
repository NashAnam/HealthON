'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getLatestAssessment } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/riskCalculator';
import { Activity, Heart, Droplet, Zap, Brain, ArrowRight, RefreshCw, FileText } from 'lucide-react';

export function AssessmentResultPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scores, setScores] = useState(null);
    const [assessment, setAssessment] = useState(null);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return router.replace('/login');

            const { data: patient } = await getPatient(user.id);
            if (!patient) {
                setError('Patient profile not found.');
                setLoading(false);
                return;
            }

            const { data: assessment, error: assessmentError } = await getLatestAssessment(patient.id);

            if (assessmentError) {
                console.error('Error fetching assessment:', assessmentError);
                setError('Failed to load assessment results. Please try again.');
            } else if (assessment) {
                setScores(assessment.scores);
                setAssessment(assessment);
            } else {
                // No assessment found
                setScores(null);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> Retry
            </button>
        </div>
    );

    if (!scores) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No Assessment Found</h2>
            <button onClick={() => router.push('/patient/assessment')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Take Assessment</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Activity className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Health Report</h1>
                    <p className="text-slate-500">Based on your recent assessment.</p>
                </div>

                <div className="grid gap-6">
                    <ScoreCard
                        title="Diabetes Risk"
                        score={scores.diabetes}
                        condition="diabetes"
                        icon={Droplet}
                        max={100}
                    />
                    <ScoreCard
                        title="Hypertension Risk"
                        score={scores.hypertension}
                        condition="hypertension"
                        icon={Activity}
                        max={15}
                    />
                    <ScoreCard
                        title="Heart Disease (CVD)"
                        score={scores.cvd}
                        condition="cvd"
                        icon={Heart}
                        max={20}
                    />
                    <ScoreCard
                        title="Dyslipidemia (Cholesterol)"
                        score={scores.dyslipidemia}
                        condition="dyslipidemia"
                        icon={Zap}
                        max={15}
                    />
                    <ScoreCard
                        title="Thyroid Disorder"
                        score={scores.thyroid}
                        condition="thyroid"
                        icon={Brain}
                        max={20}
                    />
                </div>

                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => router.push('/patient/dashboard')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold transition-all"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => router.push('/patient/assessment')}
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" /> Retake Assessment
                    </button>
                    <button
                        onClick={() => router.push('/patient/lab')}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <FileText className="w-5 h-5" /> Lab Test
                    </button>
                    <button
                        onClick={() => router.push('/patient/action-plan')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Zap className="w-5 h-5" /> 7-Day Action Plan
                    </button>
                    <button
                        onClick={() => router.push('/patient/doctor-booking')}
                        className="bg-plum-700 hover:bg-plum-800 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-plum-700/20 transition-all flex items-center justify-center gap-2"
                    >
                        Consult<ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="mt-12 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <FileText className="text-indigo-600" /> Assessment Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem label="Height" value={`${assessment?.answers?.height || '--'} cm`} />
                        <DetailItem label="Weight" value={`${assessment?.answers?.weight || '--'} kg`} />
                        <DetailItem label="BMI" value={assessment?.answers?.bmi || '--'} />
                        <DetailItem label="Smoking/Tobacco" value={assessment?.answers?.tobacco === 'yes' ? 'Yes' : 'No'} />
                        <DetailItem label="Diabetes History" value={assessment?.answers?.history_diabetes === 'yes' ? 'Yes' : 'No'} />
                        <DetailItem label="BP History" value={assessment?.answers?.history_bp === 'yes' ? 'Yes' : 'No'} />
                        <DetailItem label="Stress Level" value={assessment?.answers?.stress || 'Normal'} />
                        <DetailItem label="Sleep Quality" value={assessment?.answers?.sleep === 'yes' ? 'Poor' : 'Good'} />
                    </div>
                </div>
            </div>
        </div>
    );
}

const ScoreCard = ({ title, score, condition, icon: Icon, max }) => {
    const { level, color, bg } = getRiskLevel(condition, score);
    const percentage = Math.min((score / max) * 100, 100);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-7 h-7 ${color}`} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${bg} ${color}`}>
                        {level} Risk
                    </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${level === 'High' ? 'bg-rose-500' : level === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
            <div className="text-right min-w-[60px]">
                <span className="block text-2xl font-bold text-slate-900">{score}</span>
                <span className="text-xs text-slate-400">/ {max}</span>
            </div>
        </div>
    );
};
const DetailItem = ({ label, value }) => (
    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-slate-900 capitalize">{value}</span>
    </div>
);

export default AssessmentResultPage;
