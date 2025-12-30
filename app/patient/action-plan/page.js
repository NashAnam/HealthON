'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getLatestAssessment, createReminder, supabase } from '@/lib/supabase';
import { ChevronLeft, Calendar, Zap, Utensils, Activity, Sun, CheckCircle2, Trophy, ArrowRight, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const CLINICAL_ADVICE = {
    diabetes: {
        diet: [
            "Clinical Focus: Glycemic Load Management. Breakfast: Steel-cut oats with cinnamon and walnuts.",
            "Metabolic Balance: Focus on complex carbohydrates. Lunch: Grilled tofu/tempeh with brown rice and asparagus.",
            "Glucose Stabilization: High Fiber (30g+). Dinner: Baked cod with roasted cauliflower.",
            "Anti-Inflammatory: Incorporate berries and walnuts. Avoid refined sugars and processed flours.",
            "Protein Optimization: Breakfast: Avocado toast on whole grain sprouted bread.",
            "Low Glycemic Snacks: Raw almonds or seeds. Dinner: Zucchini noodles with pesto.",
            "Systemic Reset: Primarily green-leafy vegetables and lean proteins. Zero simple carbs."
        ],
        exercise: [
            "Post-Meal Brisk Walk (15 mins): Regulate postprandial glucose levels.",
            "Zone 2 Cardio (30 mins): Enhance insulin sensitivity and mitochondrial health.",
            "Resistance Training: Focus on large muscle groups to improve glucose uptake.",
            "Steady-State Movement: 30 minutes of rhythmic walking or light cycling.",
            "Moderate Intensity Intervals: 10 mins fast walk, 10 mins slow walk.",
            "Full Body Flexibility: 20 minutes of dynamic stretching.",
            "Active Recovery: 45-minute low-intensity hike or nature walk."
        ]
    },
    hypertension: {
        diet: [
            "DASH Protocol: Sodium < 1,500mg. Focus on potassium-rich bananas and spinach.",
            "Vasodilation Focus: High nitrate vegetables (beets, arugula) to support nitric oxide.",
            "Magnesium Optimization: Dinner: Lentil stew with turmeric and ginger.",
            "Heart Healthy Fats: Steam salmon with steamed bok choy. Use extra virgin olive oil.",
            "Mineral Balance: Swap table salt for herbs and spices (lemon, garlic, oregano).",
            "Hydration Protocol: 3 liters of mineralized water with a pinch of Celtic salt.",
            "Vasoprotective Nutrition: Primarily organic liquids and high-nutrient greens."
        ],
        exercise: [
            "Isometric Exercises: Handgrip exercises (10 mins) to support vascular tone.",
            "Aerobic Base: Brisk Walk (45 mins) - Maintain heart rate at 50-60% of max.",
            "Rhythmic Breathing: Focus on nasal breathing during 30 mins of light activity.",
            "Zone 1 Recovery: Slow nature walk (40 mins). Goal: Parasympathetic activation.",
            "Vigorous Movement: 30 mins swimming or cycling. Monitor exertion closely.",
            "Yoga/Mobility: Focus on spinal mobility and chest opening poses.",
            "Low-Impact Cardio: 60-minute slow hike. Impact: Promotes lymphatic drainage."
        ]
    },
    cvd: {
        diet: [
            "Mediterranean Focus: Omega-3 rich fatty fish and abundant leafy greens.",
            "Cholesterol Modulation: Incorporate soluble fiber (beans, lentils, oats).",
            "Phytochemical Day: Red berries, orange carrots, green peppers for arterial health.",
            "Clinical Focus: Zero trans fats. Breakfast: Chia seed pudding with flax seeds.",
            "Endothelial Support: Dark chocolate (>85%) and green tea for flavonoid intake.",
            "Macro Balancing: 40% Carb, 30% Protein, 30% Healthy Fats (Monounsaturated).",
            "Cardiac Reset: High-nutrient vegetable broth and lean steamed protein."
        ],
        exercise: [
            "Cardiac Conditioning: Brisk Walk (30 mins). Goal: Sustain consistent metabolic rate.",
            "Zone 2 Steady State: 40 minutes of cycling or rowing at conversational pace.",
            "Vagus Nerve Stimulation: Practice box breathing during light stretching.",
            "Aerobic Interval: 15 mins moderate, 15 mins light. Impact: Heart rate variability.",
            "Endurance Base: 50 minutes of sustained low-intensity movement.",
            "Restorative Yoga: Focus on deep tissue release and lower heart rate.",
            "Cognitive Reset: Digital detox hike (60 mins). Total environmental awareness."
        ]
    },
    general: {
        diet: [
            "Nutrient Density Focus: Diverse rainbow of vegetables and lean proteins.",
            "Metabolic Flexibility: 12-hour intermittent fasting window (7pm to 7am).",
            "Hydration Baseline: 2.5 Liters of filtered water with electrolytes.",
            "Anti-Inflammatory Shield: Turmeric, ginger, and garlic in main meals.",
            "Fiber Optimization: Target 35g+ daily via seeds and legumes.",
            "Omega-3 Support: Walnuts, chia seeds, or fatty fish twice weekly.",
            "Systemic Balance: Zero refined oils or high-fructose corn syrup."
        ],
        exercise: [
            "Functional Movement: 30-minute brisk walk. Focus on posture.",
            "Strength Foundation: Bodyweight squats, planks, and push-ups (20 mins).",
            "Aerobic Capacity: Light jogging or cycling at conversational pace.",
            "Mobility Flow: Yoga-based stretching focused on hip and shoulder health.",
            "Mitochondrial Support: 15 minutes of high-intensity functional training.",
            "Postural Reset: Foam rolling and deep tissue release (20 mins).",
            "Active Longevity: 60-minute low-impact hiking or walking."
        ]
    }
};

const LIFESTYLE_ADVICE = {
    diabetes: [
        "Circadian Alignment: Goal 8h sleep to regulate cortisol and insulin sensitivity.",
        "Post-Prandial Protocol: Light 10m movement after every major meal.",
        "Stress Mitigation: Practice 4-7-8 breathing to lower sympathetic drive.",
        "Sleep Hygiene: Zero blue light 60m before bed to support melatonin.",
        "Metabolic Monitoring: Document energy levels vs. meal timing in notes.",
        "Consistency focus: Regular meal times (+/- 30m) for stable endocrine response.",
        "Vascular Health: Cold-warm shower contrast to support peripheral circulation."
    ],
    hypertension: [
        "Vagus Nerve Support: Humming or gargling (2 mins) to increase HRV.",
        "Autonomic Calibration: 15m guided meditation to lower systemic resistance.",
        "Nasal Breathing: Exclusively breathe through the nose to increase CO2/O2 exchange.",
        "Ergonomic Posture: Alignment of spine to prevent thoracic compression.",
        "Magnesium Soak: Epsom salt bath (20 mins) to support smooth muscle relaxation.",
        "Quiet Hour: Total silence for 30 mins to reduce sensory overload.",
        "Biofeedback: Monitor resting heart rate upon waking for recovery trends."
    ],
    cvd: [
        "Oxidative Stress Reduction: Grounding/Earth-walk (10 mins) in nature.",
        "Nitric Oxide Support: Sun exposure (15 mins) to support vascular dilation.",
        "Cardio-Metabolic Rest: Ensure 9h of restorative horizontal rest.",
        "Social Connectivity: Meaningful interaction to stimulate oxytocin release.",
        "Strategic Hydration: Drink 500ml water immediately upon waking.",
        "Tactile Hobbies: Gardening or journaling to lower steady-state heart rate.",
        "Systemic Detox: Dry brushing (5 mins) before showering for lymphatic flow."
    ],
    general: [
        "Baseline Wellness: Focus on consistent hydration and regular movement.",
        "Mental Clarity: 10m morning silence before digital engagement.",
        "Occupational Health: Stand for 5m every 55m of seated work.",
        "Nutrition Awareness: Mindful eating - chew each bite 20 times.",
        "Environment Optimization: Remove clutter to reduce cognitive load.",
        "Personal Reflection: Review three wins from the previous 24 hours.",
        "Weekly Audit: Plan the upcoming 7-day health cycle."
    ]
};

const getFallbackAdvice = (day) => ({
    diet: CLINICAL_ADVICE.general.diet[(day - 1) % 7],
    exercise: CLINICAL_ADVICE.general.exercise[(day - 1) % 7],
    lifestyle: LIFESTYLE_ADVICE.general[(day - 1) % 7]
});

const generatePersonalizedPlan = (assessment) => {
    if (!assessment || !assessment.scores) {
        return Array.from({ length: 7 }, (_, i) => ({ day: i + 1, ...getFallbackAdvice(i + 1) }));
    }

    const s = assessment.scores;
    const activeRisks = [];
    if (s.diabetes > 30) activeRisks.push('diabetes');
    if (s.hypertension > 4) activeRisks.push('hypertension');
    if (s.cvd > 5) activeRisks.push('cvd');

    // Default to CVD/General if no high risks
    if (activeRisks.length === 0) activeRisks.push('cvd');

    return Array.from({ length: 7 }, (_, i) => {
        const day = i + 1;
        const risk = activeRisks[i % activeRisks.length];
        const advice = CLINICAL_ADVICE[risk] || CLINICAL_ADVICE.general;
        const lifestyle = LIFESTYLE_ADVICE[risk] || LIFESTYLE_ADVICE.general;

        return {
            day,
            diet: advice.diet[i % 7],
            exercise: advice.exercise[i % 7],
            lifestyle: lifestyle[i % 7]
        };
    });
};

export default function ActionPlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [plan, setPlan] = useState([]);
    const [selectedDay, setSelectedDay] = useState(1);
    const [overallRisk, setOverallRisk] = useState('low');
    const [completedTasks, setCompletedTasks] = useState({}); // { 'day-type': true }

    useEffect(() => {
        loadPlan();
    }, []);

    const loadPlan = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return router.push('/login');

            const { data: patientData } = await getPatient(user.id);
            if (!patientData) return router.push('/complete-profile');

            const { data: assessment } = await getLatestAssessment(patientData.id);

            let risk = 'low';
            if (assessment) {
                const s = assessment.scores;
                if (s.diabetes > 60 || s.hypertension > 8 || s.cvd > 10) risk = 'high';
                else if (s.diabetes > 30 || s.hypertension > 4 || s.cvd > 5) risk = 'moderate';
            }

            setPatient(patientData);
            const personalizedPlan = generatePersonalizedPlan(assessment);
            setPlan(personalizedPlan);

            // Load completion state from local storage for now (MVP)
            const saved = localStorage.getItem('healthon_action_plan_completed');
            if (saved) setCompletedTasks(JSON.parse(saved));

            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load action plan');
        }
    };

    const toggleTask = async (day, type) => {
        const key = `${day}-${type}`;
        const isCompleting = !completedTasks[key];
        const newCompleted = { ...completedTasks, [key]: isCompleting };
        setCompletedTasks(newCompleted);
        localStorage.setItem('healthon_action_plan_completed', JSON.stringify(newCompleted));

        if (isCompleting) {
            toast.success('Task marked as complete! +20 Points', { icon: '👏' });
            if (patient) {
                const { error: rpcError } = await supabase.rpc('award_points', {
                    input_user_id: patient.user_id,
                    amount: 20
                });

                if (rpcError) {
                    console.error('Points RPC Error:', rpcError);
                    toast.error('Sync failed. Did you run the SQL fix?');
                }

                const { data: updatedPatient } = await getPatient(patient.user_id);
                if (updatedPatient) setPatient(updatedPatient);
            }
        } else {
            toast('Task unmarked. -20 Points', { icon: '↩️' });
            if (patient) {
                const { error: rpcError } = await supabase.rpc('award_points', {
                    input_user_id: patient.user_id,
                    amount: -20
                });

                if (rpcError) {
                    console.error('Points RPC Error:', rpcError);
                    toast.error('Sync failed. Did you run the SQL fix?');
                }

                const { data: updatedPatient } = await getPatient(patient.user_id);
                if (updatedPatient) setPatient(updatedPatient);
            }
        }
    };

    const handleSetReminder = async () => {
        if (!patient) return;
        const tid = toast.loading('Setting reminder...');
        try {
            const reminderData = {
                patient_id: patient.id,
                title: `Action Plan: Day ${selectedDay} Tasks`,
                description: `Focus on: ${currentDayData.diet.substring(0, 30)}...`,
                reminder_time: '09:00', // Default morning reminder
                reminder_type: 'health_check',
                frequency: 'specific',
                reminder_date: new Date().toLocaleDateString('en-CA'),
                is_active: true
            };
            await createReminder(reminderData);
            toast.success('Reminder set! View it in "My Reminders"', { id: tid });
        } catch (error) {
            toast.error('Failed to set reminder', { id: tid });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>;

    const currentDayData = plan.find(d => d.day === selectedDay);

    return (
        <div className="min-h-screen bg-[#F8FAFB] p-4 md:p-8 font-sans text-slate-900 transition-all duration-300">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={() => router.back()} className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 group">
                            <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="md:hidden">
                            <h1 className="text-xl font-black text-slate-900 leading-tight">7-Day Action Plan</h1>
                        </div>
                    </div>
                    <div className="hidden md:block text-center flex-1">
                        <h1 className="text-2xl font-black text-slate-900">7-Day Personalised Action Plan</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tailored for {patient?.name}</p>
                    </div>
                    <button
                        onClick={() => router.push('/patient/reminders')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-all shadow-sm"
                    >
                        <Bell size={14} /> My Reminders
                    </button>
                </div>

                {/* Risk Summary Badge */}
                <div className={`mb-6 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 shadow-sm ${overallRisk === 'high' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                    overallRisk === 'moderate' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                        'bg-emerald-50 border-emerald-100 text-emerald-700'
                    }`}>
                    <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                        <Zap size={14} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Clinical Insight</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{overallRisk} Risk Profile</h2>
                            <p className="mt-1 text-xs font-medium opacity-80 max-w-sm">
                                {overallRisk === 'high' ? 'Immediate intervention required. Stick strictly to this plan.' :
                                    overallRisk === 'moderate' ? 'Balanced approach needed to reduce long-term health risks.' :
                                        'Maintaining excellent health status. Keep up your current habits.'}
                            </p>
                        </div>
                        <div className="flex items-baseline gap-1 bg-white/50 px-4 py-2 rounded-xl border border-white/50">
                            <span className="text-2xl font-black">{patient?.points || 0}</span>
                            <span className="text-[10px] font-black uppercase opacity-60">Points</span>
                        </div>
                    </div>
                </div>

                {/* Day Selector */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                    {plan.map((d) => (
                        <button
                            key={d.day}
                            onClick={() => setSelectedDay(d.day)}
                            className={`flex-shrink-0 w-14 h-14 rounded-2xl font-black text-lg transition-all border-2 flex items-center justify-center ${selectedDay === d.day
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-110'
                                : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
                                }`}
                        >
                            {d.day}
                        </button>
                    ))}
                </div>

                {/* Daily Plan Card */}
                <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden mb-8">
                    <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
                        <div className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20">Day {selectedDay} Summary</div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Calendar size={14} /> Today's Focus
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        <PlanSection
                            icon={Utensils}
                            title="Nutrition"
                            content={currentDayData.diet}
                            color="text-orange-500 bg-orange-50"
                            completed={completedTasks[`${selectedDay}-diet`]}
                            onToggle={() => toggleTask(selectedDay, 'diet')}
                        />
                        <PlanSection
                            icon={Activity}
                            title="Exercise"
                            content={currentDayData.exercise}
                            color="text-indigo-500 bg-indigo-50"
                            completed={completedTasks[`${selectedDay}-exercise`]}
                            onToggle={() => toggleTask(selectedDay, 'exercise')}
                        />
                        <PlanSection
                            icon={Sun}
                            title="Habits"
                            content={currentDayData.lifestyle}
                            color="text-sky-500 bg-sky-50"
                            completed={completedTasks[`${selectedDay}-lifestyle`]}
                            onToggle={() => toggleTask(selectedDay, 'lifestyle')}
                        />
                    </div>
                </div>

                {/* Motivation Board */}
                <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full -mr-32 -mt-32 blur-3xl opacity-20" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                                <Trophy className="text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Achiever's Mindset</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-black mb-2">You're on the right track!</h3>
                            <p className="text-sm text-slate-400 font-medium">Follow this plan for significant health improvements.</p>
                        </div>
                        <button
                            onClick={handleSetReminder}
                            className="w-full md:w-auto px-10 py-5 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            Set Reminder <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Integration Section */}
            <div className="mt-12 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm overflow-hidden relative group hover:shadow-xl transition-all">
                <div className="absolute top-0 right-0 w-48 h-48 bg-teal-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Detailed Goals Setup</h3>
                        <p className="text-sm text-gray-500 font-medium">Create custom milestones based on your Action Plan to earn Power Points.</p>
                    </div>
                    <button
                        onClick={() => router.push('/patient/goals')}
                        className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 group/btn shadow-xl shadow-teal-600/20"
                    >
                        Setup Goals <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function PlanSection({ icon: Icon, title, content, color, completed, onToggle }) {
    return (
        <div className="flex flex-col gap-4 group">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${color} transition-transform group-hover:scale-110 shadow-sm flex-shrink-0`}>
                    <Icon size={18} />
                </div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
            </div>
            <div className="flex-1">
                <p className={`text-sm md:text-base font-bold leading-relaxed transition-all ${completed ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                    {content}
                </p>
                <button
                    onClick={onToggle}
                    className={`mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${completed ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-600'}`}
                >
                    <CheckCircle2 size={14} className={completed ? 'fill-emerald-500 text-white' : ''} />
                    {completed ? 'Success' : 'Complete'}
                </button>
            </div>
        </div>
    );
}
