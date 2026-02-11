'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getPatient, saveAssessment, getLatestAssessment } from '@/lib/supabase';
import { calculateAllRisks } from '@/lib/whoStepsRiskCalculator';
import { ChevronRight, ChevronLeft, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
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
  const searchParams = useSearchParams();
  const retake = searchParams.get('retake');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    loadPatient();
  }, []);

  const loadPatient = async () => {
    const user = await getCurrentUser();
    if (!user) return router.replace('/login');
    const { data } = await getPatient(user.id);
    setPatient(data);

    if (data && !retake) {
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

      // 2. Calculate Scores using WHO STEPS
      const { scores } = calculateAllRisks(finalAnswers);

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

  if (!patient) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5D2A42]"></div></div>;

  const currentQ = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;
  const hasAnsweredCurrent = currentQ.type === 'bmi_input'
    ? (answers.height && answers.weight)
    : (answers[currentQ.key] !== undefined);

  return (
    <div className="min-h-screen bg-white py-8 px-4 font-sans text-slate-900 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            <span>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5D2A42] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 min-h-[400px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-500">

          <div className="flex items-start gap-4 mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight flex-1">
              {currentQ.label}
            </h2>
            {/* Audio Playback Button */}
            <button
              onClick={() => {
                if ('speechSynthesis' in window) {
                  if (isPlaying) {
                    window.speechSynthesis.cancel();
                    setIsPlaying(false);
                  } else {
                    // Convert question to more natural spoken language
                    let spokenText = currentQ.label;

                    // Make questions more conversational for voice
                    const naturalConversions = {
                      'How old are you?': 'How old are you? Please select your age group.',
                      'What is your gender?': 'What is your gender? Please select male or female.',
                      'How is your waist size?': 'How is your waist size? Does your belly feel large? Please select your answer.',
                      'What are your body measurements?': 'What are your body measurements? Please enter your height and weight to calculate your B M I.',
                      'How much do you move daily?': 'How much do you move daily? Do you exercise, walk, or mostly sit?',
                      'What are your eating habits?': 'What are your eating habits? Do you eat home food, or oily and sweet items?',
                      'Do you eat a lot of salt?': 'Do you eat a lot of salt? Like pickles, papad, or salty snacks?',
                      'Do you smoke or chew tobacco?': 'Do you smoke or chew tobacco? Please answer yes or no.',
                      'Do you drink alcohol?': 'Do you drink alcohol? Please select your answer.',
                      'Do you have Diabetes (Sugar)?': 'Do you have Diabetes, also known as Sugar? Please answer yes or no.',
                      'Do you have High Blood Pressure?': 'Do you have High Blood Pressure, also known as B P? Please answer yes or no.',
                      'Do you have Heart Disease?': 'Do you have any Heart Disease? Please answer yes or no.',
                      'Does anyone in your family have these conditions?': 'Does anyone in your family have these conditions? Like diabetes, blood pressure, or heart problems?',
                      'Do you feel stressed often?': 'Do you feel stressed often? Please select your answer.',
                      'How well do you sleep?': 'How well do you sleep at night? Please select your answer.'
                    };

                    // Use natural conversion if available
                    if (naturalConversions[currentQ.label]) {
                      spokenText = naturalConversions[currentQ.label];
                    } else if (currentQ.subLabel) {
                      spokenText = `${currentQ.label} ${currentQ.subLabel}`;
                    }

                    const utterance = new SpeechSynthesisUtterance(spokenText);
                    utterance.onend = () => setIsPlaying(false);

                    // Configure for natural English pronunciation
                    utterance.lang = 'en-IN'; // Indian English for natural pronunciation
                    utterance.rate = 0.85; // Slower for clarity and natural conversation
                    utterance.pitch = 1.0;
                    utterance.volume = 1.0;

                    // Try to find a good English voice (avoid pure Hindi/Urdu)
                    const voices = window.speechSynthesis.getVoices();
                    // Prefer Indian English, then UK/US English voices
                    const preferredVoice = voices.find(v =>
                      v.lang.includes('en-IN') ||
                      v.lang.includes('en-GB') ||
                      v.lang.includes('en-US')
                    );
                    if (preferredVoice) {
                      utterance.voice = preferredVoice;
                    }

                    window.speechSynthesis.speak(utterance);
                    setIsPlaying(true);
                  }
                } else {
                  toast.error('Text-to-speech not supported in this browser');
                }
              }}
              className="p-4 bg-[#649488] hover:bg-[#527569] text-white rounded-2xl transition-all shadow-lg flex-shrink-0"
              title="Read Question"
            >
              {isPlaying ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>

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
                    className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl text-2xl font-bold focus:outline-none focus:border-[#5D2A42] focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="70"
                    value={answers.weight || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl text-2xl font-bold focus:outline-none focus:border-[#5D2A42] focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
              {answers.height && answers.weight && (
                <div className="p-6 bg-[#648C81]/10 rounded-3xl border-2 border-[#648C81]/20 animation-in fade-in zoom-in">
                  <p className="text-[#648C81] font-bold text-center text-xl">
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
                    ? 'border-[#5D2A42] bg-[#5D2A42] text-white ring-4 ring-[#5D2A42]/20'
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-[#648C81]/30 hover:bg-white'
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
              className="bg-[#648C81] hover:bg-[#527569] text-white px-10 py-4 rounded-2xl font-bold text-xl shadow-lg shadow-[#648C81]/20 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Finish Assessment'}
              {!loading && <CheckCircle2 className="w-6 h-6" />}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!hasAnsweredCurrent}
              className={`flex items-center gap-2 text-lg font-bold px-8 py-4 rounded-2xl transition-all ${hasAnsweredCurrent
                ? 'bg-[#5D2A42] text-white shadow-lg shadow-[#5D2A42]/20 hover:bg-[#4a2135]'
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