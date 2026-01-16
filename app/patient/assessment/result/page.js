'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getLatestAssessment } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/whoStepsRiskCalculator';
import { Activity, Heart, Droplet, Zap, Brain, ArrowRight, RefreshCw, FileText, AlertTriangle, ShieldAlert, MoreVertical, ArrowLeft } from 'lucide-react';
import { useSidebar } from '@/lib/SidebarContext';

export function AssessmentResultPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scores, setScores] = useState(null);
    const [assessment, setAssessment] = useState(null);
    const { toggle } = useSidebar();

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
                setScores(null);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5D2A42]"></div></div>;

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-white">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-[#5D2A42] hover:bg-[#4a2135] text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> Retry
            </button>
        </div>
    );

    if (!scores) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-white">
            <h2 className="text-2xl font-black text-slate-900 mb-4">No Assessment Found</h2>
            <button onClick={() => router.push('/patient/assessment')} className="bg-[#5D2A42] text-white px-6 py-3 rounded-xl font-black">Take Assessment</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
            {/* Header */}
            <header className="bg-white sticky top-0 z-30 border-b border-gray-100 px-6 py-6 shadow-sm">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggle}
                            className="lg:hidden p-2 -ml-2 text-[#4a2b3d] hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <MoreVertical className="w-6 h-6" />
                        </button>
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
                            <ArrowLeft className="w-6 h-6 text-slate-900" />
                        </button>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-[0.2em]">Health Review</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Assessment Result</p>
                    </div>
                    <div className="w-10 lg:hidden" />
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-8 md:mb-12">
                    <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-teal-600" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">Health Risk Assessment</h1>
                    <p className="text-sm text-slate-500 font-medium max-w-lg mx-auto">Based on WHO STEPS (Step 1) Framework. This analysis identifies non-lab based risk patterns.</p>
                </div>

                <div className="grid gap-6">
                    <ScoreCard
                        title="Diabetes Risk Pattern"
                        score={scores.diabetes}
                        condition="diabetes"
                        icon={Droplet}
                        max={100}
                        confidence={assessment.individualConfidence?.diabetes || 'moderate'}
                    />
                    <ScoreCard
                        title="Hypertension Risk Pattern"
                        score={scores.hypertension}
                        condition="hypertension"
                        icon={Activity}
                        max={15}
                        confidence={assessment.individualConfidence?.hypertension || 'moderate'}
                    />
                    <ScoreCard
                        title="Cardiovascular Risk Pattern"
                        score={scores.cvd}
                        condition="cvd"
                        icon={Heart}
                        max={20}
                        confidence={assessment.individualConfidence?.cvd || 'moderate'}
                    />
                    <ScoreCard
                        title="Dyslipidemia Risk Pattern"
                        score={scores.dyslipidemia}
                        condition="dyslipidemia"
                        icon={Zap}
                        max={15}
                        confidence={assessment.individualConfidence?.dyslipidemia || 'moderate'}
                    />
                </div>

                <div className="mt-12 text-center bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <h3 className="font-black text-slate-900 mb-2">Detailed Report Available</h3>
                    <p className="text-sm text-slate-500 mb-6">A comprehensive PDF report with your responses is available for your doctor.</p>

                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={() => router.push('/patient/dashboard')}
                            className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50"
                        >
                            Return Home
                        </button>
                        <button
                            onClick={() => router.push('/patient/assessment')}
                            className="bg-teal-50 border-2 border-teal-100 text-teal-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-teal-100 flex items-center gap-2"
                        >
                            <RefreshCw className="w-3 h-3" /> Update Responses
                        </button>
                        <button
                            onClick={() => router.push('/patient/doctor-booking')}
                            className="bg-teal-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 flex items-center gap-2"
                        >
                            Discuss with Doctor <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ScoreCard = ({ title, score, condition, icon: Icon, confidence }) => {
    // Import logic here or assume utility availability
    // Note: getRiskLevel is imported at top
    const { level } = getRiskLevel(condition, score);

    // Safety-first styling and text
    const config = {
        'High': {
            text: 'text-amber-700',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            label: 'Requires Attention',
            message: 'Your responses suggest valid risk factors. We recommend a medical review.'
        },
        'Moderate': {
            text: 'text-blue-700',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            label: 'Moderate Impact',
            message: 'Some risk factors identified. Focusing on lifestyle changes may help reduce risk.'
        },
        'Low': {
            text: 'text-teal-700',
            bg: 'bg-teal-50',
            border: 'border-teal-100',
            label: 'Within Range',
            message: 'Your current lifestyle patterns align with lower risk guidelines.'
        }
    };

    const status = config[level] || config['Low'];

    return (
        <div className={`bg-white p-6 rounded-3xl border-2 ${status.border} transition-all hover:shadow-sm`}>
            <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status.bg} shrink-0`}>
                    <Icon className={`w-6 h-6 ${status.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className="font-black text-base text-slate-900">{title}</h3>
                        <div className="flex items-center gap-2">
                            {confidence && (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {confidence} Confidence
                                </span>
                            )}
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.text}`}>
                                {status.label}
                            </span>
                        </div>
                    </div>

                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        {status.message}
                    </p>
                </div>
            </div>
        </div>
    );
};

// ... existing DetailItem ...
const DetailItem = ({ label, value }) => (
    <div className="flex justify-between items-center p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border-2 border-slate-100">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-xs md:text-sm font-black text-slate-900 capitalize">{value}</span>
    </div>
);

export default AssessmentResultPage;

