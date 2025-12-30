'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, saveAssessment, getLatestAssessment } from '@/lib/supabase';
import { calculateRiskScores } from '@/lib/riskCalculator';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const QUESTIONS = [
  // --- SECTION A: Basic Details ---
  {
    key: 'age',
    label: 'How old are you?',
    options: [
      { label: 'Under 35', value: 30 },
      { label: '35 to 49', value: 40 },
      { label: '50 or older', value: 55 }
    ]
  },
  {
    key: 'gender',
    label: 'What is your gender?',
    options: [
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' }
    ]
  },

  // --- SECTION B: Body Measurements ---
  {
    key: 'waist',
    label: 'How is your waist size?',
    subLabel: 'Does your belly feel large?',
    options: [
      { label: 'Normal / Slim', value: 'low' },
      { label: 'A bit heavy', value: 'medium' },
      { label: 'Very heavy', value: 'high' }
    ]
  },
  {
    key: 'height_weight',
    label: 'What are your body measurements?',
    subLabel: 'Enter your height and weight to calculate BMI.',
    type: 'bmi_input'
  },

  // --- SECTION C: Lifestyle ---
  {
    key: 'activity',
    label: 'How much do you move daily?',
    options: [
      { label: 'I exercise daily', value: 'vigorous' },
      { label: 'I walk sometimes', value: 'moderate' },
      { label: 'I mostly sit', value: 'sedentary' }
    ]
  },
  {
    key: 'diet',
    label: 'What are your eating habits?',
    options: [
      { label: 'Home food / Healthy', value: 'healthy' },
      { label: 'Mix of both', value: 'moderate' },
      { label: 'Oily / Sweet / Junk', value: 'high_fat' }
    ]
  },
  {
    key: 'salt',
    label: 'Do you eat a lot of salt?',
    subLabel: 'Pickles, papad, salty snacks?',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Normal', value: 'moderate' },
      { label: 'High (I love salt)', value: 'high' }
    ]
  },
  {
    key: 'tobacco',
    label: 'Do you smoke or chew tobacco?',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ]
  },
  {
    key: 'alcohol',
    label: 'Do you drink alcohol?',
    options: [
      { label: 'No / Rarely', value: 'none' },
      { label: 'Yes, often', value: 'frequent' }
    ]
  },

  // --- SECTION D: Medical History ---
  {
    key: 'history_diabetes',
    label: 'Do you have Diabetes (Sugar)?',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ]
  },
  {
    key: 'history_bp',
    label: 'Do you have High Blood Pressure?',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ]
  },
  {
    key: 'history_heart',
    label: 'Do you have any Heart Problems?',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ]
  },
  {
    key: 'history_autoimmune',
    label: 'Do you have an Autoimmune Disease?',
    subLabel: 'Like Type 1 Diabetes, Rheumatoid Arthritis',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ]
  },

  // --- SECTION E: Family History ---
  {
    key: 'family_diabetes',
    label: 'Does anyone in your family have Diabetes?',
    subLabel: 'Parents or Siblings',
    options: [
      { label: 'No one', value: 'none' },
      { label: 'One Parent', value: 'one' },
      { label: 'Both Parents', value: 'both' }
    ]
  },
  {
    key: 'family_heart',
    label: 'Any Heart Disease in family?',
    subLabel: 'Especially at a young age',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ]
  },
  {
    key: 'family_cholesterol',
    label: 'High Cholesterol in family?',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ]
  },
  {
    key: 'family_thyroid',
    label: 'Thyroid problems in family?',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ]
  },

  // --- SECTION F: Symptoms ---
  {
    key: 'thyroid_symptoms',
    label: 'Do you have Thyroid symptoms?',
    subLabel: 'Feeling very tired, hair fall, feeling too cold/hot?',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ]
  },
  {
    key: 'neck_swelling',
    label: 'Do you have swelling in your neck?',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ]
  },
  {
    key: 'stress',
    label: 'How stressed do you feel daily?',
    options: [
      { label: 'Relaxed', value: 'low' },
      { label: 'A bit stressed', value: 'moderate' },
      { label: 'Very stressed', value: 'high' }
    ]
  },
  {
    key: 'sleep',
    label: 'Do you sleep well?',
    subLabel: 'At least 6-7 hours?',
    options: [
      { label: 'Yes, I sleep well', value: 'no' }, // "no" means no sleep problem
      { label: 'No, poor sleep', value: 'yes' }
    ]
  }
];

export default function AssessmentPage() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    loadPatient();
  }, []);

  const loadPatient = async () => {
    const user = await getCurrentUser();
    if (!user) return router.replace('/login');
    const { data } = await getPatient(user.id);
    setPatient(data);

    if (data) {
      const { data: assessmentData } = await getLatestAssessment(data.id);
      if (assessmentData) {
        toast.success('Loading your latest health assessment results...');
        router.replace('/patient/assessment/result');
      }
    }
  };

  const handleAnswer = (value) => {
    const currentQ = QUESTIONS[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQ.key]: value }));

    // Auto-advance after a short delay for better UX
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 250);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Calculate BMI if height and weight are provided
      let finalAnswers = { ...answers };
      if (answers.height && answers.weight) {
        const h = parseFloat(answers.height) / 100;
        const w = parseFloat(answers.weight);
        finalAnswers.bmi = parseFloat((w / (h * h)).toFixed(1));
      }

      // 2. Calculate Scores
      const scores = calculateRiskScores(finalAnswers);

      // 3. Save to Database
      const { error } = await saveAssessment(patient.id, finalAnswers, scores);
      if (error) throw error;

      // 4. Redirect to Results
      toast.success('Assessment Complete!');
      router.push('/patient/assessment/result');

    } catch (error) {
      console.error('Assessment error object:', error);
      console.error('Assessment error message:', error?.message);
      console.error('Assessment error details:', error?.details);
      console.error('Assessment error hint:', error?.hint);
      toast.error('Failed to save assessment. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (!patient) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;

  const currentQ = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;
  const hasAnsweredCurrent = currentQ.type === 'bmi_input'
    ? (answers.height && answers.weight)
    : (answers[currentQ.key] !== undefined);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-900 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            <span>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 min-h-[400px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-500">

          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            {currentQ.label}
          </h2>

          {currentQ.subLabel && (
            <p className="text-xl text-slate-500 mb-8 font-medium">
              {currentQ.subLabel}
            </p>
          )}

          {currentQ.type === 'bmi_input' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="170"
                    value={answers.height || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, height: e.target.value }))}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl text-2xl font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="70"
                    value={answers.weight || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl text-2xl font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
              {answers.height && answers.weight && (
                <div className="p-6 bg-indigo-50 rounded-3xl border-2 border-indigo-100 animation-in fade-in zoom-in">
                  <p className="text-indigo-600 font-bold text-center text-xl">
                    Calculated BMI: {((parseFloat(answers.weight) / Math.pow(parseFloat(answers.height) / 100, 2)) || 0).toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {currentQ.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className={`w-full text-left px-8 py-6 rounded-3xl text-xl font-bold border-2 transition-all shadow-sm hover:shadow-md flex items-center justify-between group ${answers[currentQ.key] === opt.value
                    ? 'border-indigo-600 bg-indigo-600 text-white ring-4 ring-indigo-600/20'
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-white'
                    }`}
                >
                  {opt.label}
                  {answers[currentQ.key] === opt.value && (
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  )}
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 px-4">
          <button
            onClick={handleBack}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center gap-2 text-lg font-bold px-6 py-3 rounded-2xl transition-colors ${currentQuestionIndex === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
              }`}
          >
            <ChevronLeft className="w-6 h-6" /> Back
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!hasAnsweredCurrent || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-bold text-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Finish Assessment'}
              {!loading && <CheckCircle2 className="w-6 h-6" />}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!hasAnsweredCurrent}
              className={`flex items-center gap-2 text-lg font-bold px-8 py-4 rounded-2xl transition-all ${hasAnsweredCurrent
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              Next <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}