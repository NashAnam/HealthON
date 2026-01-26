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

    // Convert raw scores to 1-10 scale
    const convertTo10Scale = (condition, rawScore) => {
        // Map different scoring systems to 1-10 scale
        const mappings = {
            diabetes: { max: 100, threshold: { low: 30, high: 60 } },
            hypertension: { max: 15, threshold: { low: 5, high: 10 } },
            cvd: { max: 20, threshold: { low: 7, high: 14 } },
            dyslipidemia: { max: 15, threshold: { low: 5, high: 10 } }
        };

        const config = mappings[condition];
        if (!config) return 5; // Default middle value

        // Normalize to 0-1 range
        const normalized = rawScore / config.max;

        // Convert to 1-10 scale
        const score = Math.round(normalized * 10);
        return Math.max(1, Math.min(10, score)); // Clamp between 1-10
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
                    <p className="text-sm text-slate-500 font-medium max-w-lg mx-auto">Based on WHO STEPS (Step 1) Framework. Risk scores shown on a scale of 1-10.</p>
                </div>

                <div className="grid gap-6">
                    <RiskScoreCard
                        title="Diabetes Risk"
                        score={convertTo10Scale('diabetes', scores.diabetes)}
                        rawScore={scores.diabetes}
                        icon={Droplet}
                    />
                    <RiskScoreCard
                        title="Hypertension Risk"
                        score={convertTo10Scale('hypertension', scores.hypertension)}
                        rawScore={scores.hypertension}
                        icon={Activity}
                    />
                    <RiskScoreCard
                        title="Cardiovascular Risk"
                        score={convertTo10Scale('cvd', scores.cvd)}
                        rawScore={scores.cvd}
                        icon={Heart}
                    />
                    <RiskScoreCard
                        title="Dyslipidemia Risk"
                        score={convertTo10Scale('dyslipidemia', scores.dyslipidemia)}
                        rawScore={scores.dyslipidemia}
                        icon={Zap}
                    />
                </div>

                <div className="mt-12 text-center bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <h3 className="font-black text-slate-900 mb-2">Next Steps</h3>
                    <p className="text-sm text-slate-500 mb-6">Review your risk scores and discuss with a healthcare professional.</p>

                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={() => router.push('/patient/dashboard')}
                            className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50"
                        >
                            Return Home
                        </button>
                        <button
                            onClick={() => router.push('/patient/assessment?retake=true')}
                            className="bg-teal-50 border-2 border-teal-100 text-teal-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-teal-100 flex items-center gap-2"
                        >
                            <RefreshCw className="w-3 h-3" /> Re-take Assessment
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

const RiskScoreCard = ({ title, score, rawScore, icon: Icon }) => {
    const getRiskColor = (score) => {
        if (score <= 3) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Low Risk' };
        if (score <= 6) return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Moderate Risk' };
        return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'High Risk' };
    };

    const status = getRiskColor(score);

    return (
        <div className={`bg-white p-6 rounded-3xl border-2 ${status.border} transition-all hover:shadow-lg`}>
            <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status.bg} shrink-0`}>
                    <Icon className={`w-6 h-6 ${status.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h3 className="font-black text-lg text-slate-900">{title}</h3>
                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${status.bg} ${status.text}`}>
                            {status.label}
                        </span>
                    </div>

                    {/* Risk Score Display */}
                    <div className="mb-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${score <= 3 ? 'bg-green-500' : score <= 6 ? 'bg-yellow-500' : 'bg-red-500'} transition-all`}
                                        style={{ width: `${(score / 10) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-right min-w-[4rem]">
                                <span className="text-3xl font-black text-slate-900">{score}</span>
                                <span className="text-sm font-bold text-slate-400">/10</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm font-medium text-slate-600">
                        {score <= 3 && 'Your current lifestyle patterns align with lower risk guidelines.'}
                        {score > 3 && score <= 6 && 'Some risk factors identified. Lifestyle changes may help reduce risk.'}
                        {score > 6 && 'Risk factors detected. We recommend consulting with a healthcare professional.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AssessmentResultPage;
