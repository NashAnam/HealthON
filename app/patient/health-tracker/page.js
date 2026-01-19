'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Mic, Camera, Save, Calendar, Clock, Activity, FileText,
    ChevronRight, X, Heart, Thermometer, User, Utensils, Upload, AlertCircle, Droplets, Pill, Watch,
    ClipboardList, CheckCircle, AlertTriangle, Info, Bell, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

import Link from 'next/link';
import { useSidebar } from '@/lib/SidebarContext';
import { Menu, MoreVertical } from 'lucide-react';

export default function HealthTrackerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [logs, setLogs] = useState([]);
    const [trackerTitle, setTrackerTitle] = useState('Health Tracker');
    const [trackerPlaceholder, setTrackerPlaceholder] = useState('Enter value (e.g. 120/80)');
    const isSpecificMode = !!searchParams.get('tab');
    const { toggle } = useSidebar();

    // Data State
    const [appointments, setAppointments] = useState([]);
    const [nextAppointment, setNextAppointment] = useState(null);
    const [prescribedMeds, setPrescribedMeds] = useState([]);
    const [latestAssessment, setLatestAssessment] = useState(null);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'pr') {
            setFormData(prev => ({ ...prev, log_type: 'vitals', unit: 'bpm' }));
            setTrackerTitle('Pulse Rate Tracker');
            setTrackerPlaceholder('Enter value (e.g. 72)');
        } else if (tab === 'glucose') {
            setFormData(prev => ({ ...prev, log_type: 'vitals', unit: 'mg/dL' }));
            setTrackerTitle('Glucose Tracker');
            setTrackerPlaceholder('Enter value (e.g. 95)');
        } else if (tab === 'bp') {
            setFormData(prev => ({ ...prev, log_type: 'vitals', unit: 'mmHg' }));
            setTrackerTitle('BP Tracker');
            setTrackerPlaceholder('Enter value (e.g. 120/80)');
        } else if (tab === 'symptoms') {
            setFormData(prev => ({ ...prev, log_type: 'symptoms', unit: '' }));
            setTrackerTitle('Symptom Tracker');
            setTrackerPlaceholder('Describe symptoms...');
        } else if (tab === 'sleep') {
            setFormData(prev => ({ ...prev, log_type: 'sleep', unit: 'hours' }));
            setTrackerTitle('Sleep Tracker');
            setTrackerPlaceholder('Enter hours (e.g. 7.5)');
        } else if (tab === 'activity' || tab === 'steps') {
            setFormData(prev => ({ ...prev, log_type: 'activity', unit: 'steps' }));
            setTrackerTitle('Steps Tracker');
            setTrackerPlaceholder('Enter steps (e.g. 10000)');
        } else if (tab === 'diet') {
            setFormData(prev => ({ ...prev, log_type: 'diet', unit: 'kcal' }));
            setTrackerTitle('Diet Tracker');
            setTrackerPlaceholder('Enter calories or meal details...');
        } else if (tab === 'test' || tab === 'reports') {
            setFormData(prev => ({ ...prev, log_type: 'test', unit: '' }));
            setTrackerTitle('Test Result Tracker');
            setTrackerPlaceholder('Enter test details or upload photo...');
        } else if (tab === 'med') {
            setFormData(prev => ({ ...prev, log_type: 'med', unit: '' }));
            setTrackerTitle('Medication Tracker');
            setTrackerPlaceholder('Enter medication taken...');
        } else if (tab === 'followup') {
            setFormData(prev => ({ ...prev, log_type: 'followup', unit: '' }));
            setTrackerTitle('Follow-up Tracker');
            setTrackerPlaceholder('Enter follow-up details...');
        } else {
            setTrackerTitle('Health Tracker');
        }
    }, [searchParams]);

    // Voice & Camera State
    const [isListening, setIsListening] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const videoRef = useRef(null);
    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);

    // Form State
    const [formData, setFormData] = useState({
        log_type: 'vitals',
        value: '',
        unit: 'bpm',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return router.push('/login');

            const { data: pt } = await supabase.from('patients').select('*').eq('user_id', session.user.id).single();
            setPatient(pt);

            const { data: trackerLogs } = await supabase
                .from('tracker_logs')
                .select('*')
                .eq('patient_id', pt.id)
                .order('created_at', { ascending: false })
                .limit(100);

            setLogs(trackerLogs || []);

            // Fetch Appointments for Follow-up (Confirmed or Pending)
            const { data: appts } = await supabase
                .from('appointments')
                .select('*, doctors(name)')
                .eq('patient_id', pt.id)
                .gte('appointment_date', new Date().toISOString().split('T')[0])
                .in('status', ['confirmed', 'pending']) // Include pending so rescheduled appts show up
                .order('appointment_date', { ascending: true })
                .limit(1);

            setAppointments(appts || []);
            setNextAppointment(appts && appts.length > 0 ? appts[0] : null);

            // Fetch Latest Prescription
            const { data: rx } = await supabase
                .from('prescriptions')
                .select('*')
                .eq('patient_id', pt.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (rx && rx.medications && Array.isArray(rx.medications)) {
                setPrescribedMeds(rx.medications);
            } else {
                setPrescribedMeds([]);
            }

            // Fetch Latest Health Assessment
            const { data: assessment } = await supabase
                .from('health_assessments')
                .select('*')
                .eq('patient_id', pt.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            setLatestAssessment(assessment);

            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    const stopVoiceInput = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const toggleVoiceInput = () => {
        if (isListening) {
            stopVoiceInput();
        } else {
            startVoiceInput();
        }
    };

    const startVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            toast.error('Voice input requires Chrome/Edge.');
            return;
        }

        // Stop existing if any
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        const recognition = new window.webkitSpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript('');
            toast('Listening...', { icon: '🎙️' });
        };

        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            if (final) {
                setFormData(prev => ({
                    ...prev,
                    notes: prev.notes ? `${prev.notes} ${final}` : final
                }));
                // Keep the final text in transcript view for a moment?
                // Or clear it? Clear logic is simplest.
                setTranscript('');
                toast.success('Voice captured!');
            } else {
                setTranscript(interim);
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech' || event.error === 'aborted') {
                setIsListening(false);
                return;
            }
            console.error('Speech error', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                toast.error('Microphone access denied. Check settings.');
            } else {
                toast.error('Voice recognition failed. Try again.');
            }
        };

        recognition.start();
    };

    const startCamera = async () => {
        try {
            setShowCamera(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            toast.error('Unable to access camera');
        }
    };

    const capturePhoto = () => {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        const image = canvas.toDataURL('image/jpeg');
        setCapturedImage(image);

        // Stop stream
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        setShowCamera(false);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (formData.log_type === 'symptoms') {
            const symptomVal = activeSymptom || formData.value;
            if (!symptomVal) {
                toast.error('Please select a symptom');
                return;
            }
        } else if (!formData.value && !formData.notes && !transcript && !capturedImage) {
            toast.error('Please enter a value, description, or photo');
            return;
        }

        const tid = toast.loading('Saving log...');
        try {
            let finalNotes = formData.notes || '';
            if (formData.unit) finalNotes = `Unit: ${formData.unit} | ${finalNotes}`;
            if (transcript) finalNotes = `[Voice]: ${transcript} | ${finalNotes}`;
            if (capturedImage) finalNotes = `[Image Captured] | ${finalNotes}`;

            const logEntry = {
                patient_id: patient.id,
                log_type: formData.log_type,
                value: formData.value,
                notes: finalNotes,
                created_at: `${formData.date}T${formData.time}:00`
            };

            const { error } = await supabase.from('tracker_logs').insert([logEntry]);
            if (error) throw error;

            toast.success('Logged successfully!', { id: tid });
            setFormData({ ...formData, value: '', notes: '' });
            setTranscript('');
            setCapturedImage(null);
            loadData(); // Refresh list
        } catch (error) {
            toast.error('Error saving: ' + error.message, { id: tid });
        }
    };

    const instantLogMedication = async (med) => {
        if (!patient?.id) {
            toast.error('Identity authentication missing. Please refresh.');
            return;
        }
        const tid = toast.loading(`Logging ${med.name}...`);

        try {
            const logText = `Took ${med.name} (${med.dosage})`;
            const noteText = `Frequency: ${med.frequency} | ${med.instructions}`;

            const logEntry = {
                patient_id: patient.id,
                log_type: 'med',
                value: logText,
                notes: noteText,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase.from('tracker_logs').insert([logEntry]);
            if (error) throw error;

            toast.success(`Logged: ${med.name}`, { id: tid });
            loadData();
        } catch (error) {
            console.error('Log Error:', error);
            toast.error(`Failed: ${error.message || 'Unknown error'}`, { id: tid });
        }
    };

    const handleAddDietReminder = async (dayPlan) => {
        const tid = toast.loading('Adding reminder...');
        try {
            const reminder = {
                patient_id: patient.id,
                title: `Diet: ${dayPlan.day} - ${dayPlan.focus}`,
                description: `Breakfast: ${dayPlan.breakfast}\nLunch: ${dayPlan.lunch}\nDinner: ${dayPlan.dinner}`,
                reminder_time: '08:00 AM', // Default morning alert
                reminder_type: 'general',
                frequency: 'Daily',
                is_active: true,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('reminders').insert([reminder]);
            if (error) throw error;

            toast.success('Added to Reminders!', { id: tid });
        } catch (error) {
            console.error('Reminder Error:', error);
            toast.error('Failed to add reminder', { id: tid });
        }
    };

    const handleMarkDietComplete = async (dayPlan) => {
        const tid = toast.loading('Marking as complete...');
        try {
            const logEntry = {
                patient_id: patient.id,
                log_type: 'diet',
                value: dayPlan.day,
                notes: `Completed diet plan for ${dayPlan.day}: ${dayPlan.focus}`,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase.from('tracker_logs').insert([logEntry]);
            if (error) throw error;

            toast.success(`${dayPlan.day} marked as complete!`, { id: tid });
            loadData();
        } catch (error) {
            console.error('Diet Complete Error:', error);
            toast.error('Failed to mark as complete', { id: tid });
        }
    };

    // Get personalized 7-day action plan based on comprehensive health data
    const getDietPlan = (assessment) => {
        // Analyze patient's complete health profile
        const recentSymptoms = logs.filter(l => l.log_type === 'symptoms').slice(0, 5);
        const recentVitals = logs.filter(l => l.log_type === 'vitals').slice(0, 3);

        if (!assessment || !assessment.scores) {
            return {
                name: 'General Wellness - 7 Day Plan',
                description: 'Complete your health assessment to get a personalized action plan',
                riskLevel: 'Unknown',
                days: [
                    { day: 'Day 1', focus: 'Hydration & Greens', breakfast: 'Oats with fruits', lunch: 'Salad with grilled chicken', dinner: 'Vegetable soup', notes: 'Drink 8 glasses of water' },
                    { day: 'Day 2', focus: 'Whole Grains', breakfast: 'Whole wheat toast with eggs', lunch: 'Brown rice with dal', dinner: 'Quinoa bowl', notes: 'Add fiber to every meal' },
                    { day: 'Day 3', focus: 'Protein Power', breakfast: 'Greek yogurt with nuts', lunch: 'Fish curry with vegetables', dinner: 'Lentil soup', notes: 'Include lean protein' },
                    { day: 'Day 4', focus: 'Colorful Veggies', breakfast: 'Smoothie bowl', lunch: 'Mixed vegetable curry', dinner: 'Stir-fried vegetables', notes: 'Eat 5 different colors' },
                    { day: 'Day 5', focus: 'Healthy Fats', breakfast: 'Avocado toast', lunch: 'Salmon with greens', dinner: 'Nuts and seeds mix', notes: 'Include omega-3 sources' },
                    { day: 'Day 6', focus: 'Detox Day', breakfast: 'Green smoothie', lunch: 'Vegetable salad', dinner: 'Clear soup', notes: 'Light meals, more water' },
                    { day: 'Day 7', focus: 'Balanced Nutrition', breakfast: 'Balanced breakfast plate', lunch: 'Complete meal', dinner: 'Light dinner', notes: 'Review your week' }
                ]
            };
        }

        const scores = assessment.scores;
        const highRiskConditions = [];

        // Identify high-risk conditions
        if (scores.diabetes_risk === 'High') highRiskConditions.push('diabetes');
        if (scores.hypertension_risk === 'High') highRiskConditions.push('hypertension');
        if (scores.cvd_risk === 'High') highRiskConditions.push('cvd');
        if (scores.dyslipidemia_risk === 'High') highRiskConditions.push('dyslipidemia');
        if (scores.thyroid_risk === 'High') highRiskConditions.push('thyroid');

        // DIABETES PREVENTION PLAN
        if (highRiskConditions.includes('diabetes')) {
            return {
                name: 'Diabetes Prevention - 7 Day Action Plan',
                description: 'Personalized for High Diabetes Risk',
                riskLevel: 'High',
                primaryCondition: 'Diabetes',
                days: [
                    { day: 'Day 1', focus: 'Blood Sugar Stabilization', breakfast: 'Steel-cut oats with cinnamon & berries', lunch: 'Quinoa salad with chickpeas & vegetables', dinner: 'Grilled fish with steamed broccoli', notes: 'Start monitoring fasting glucose. Avoid white rice.' },
                    { day: 'Day 2', focus: 'Fiber Boost', breakfast: 'Whole wheat toast with avocado & eggs', lunch: 'Brown rice with mixed dal & salad', dinner: 'Vegetable soup with barley', notes: 'Aim for 25-30g fiber. Walk 30 mins after meals.' },
                    { day: 'Day 3', focus: 'Low Glycemic Foods', breakfast: 'Greek yogurt with nuts & seeds', lunch: 'Multigrain roti with palak paneer', dinner: 'Moong dal khichdi', notes: 'No sugary drinks. Choose low GI foods.' },
                    { day: 'Day 4', focus: 'Protein Power', breakfast: 'Besan chilla with mint chutney', lunch: 'Grilled chicken with quinoa', dinner: 'Tofu stir-fry with vegetables', notes: 'Protein helps control blood sugar spikes.' },
                    { day: 'Day 5', focus: 'Healthy Fats', breakfast: 'Smoothie with flaxseeds & spinach', lunch: 'Fish curry with brown rice', dinner: 'Mixed vegetable curry with roti', notes: 'Include omega-3 for insulin sensitivity.' },
                    { day: 'Day 6', focus: 'Portion Control', breakfast: 'Poha with vegetables', lunch: 'Small portions: dal, sabzi, salad', dinner: 'Light vegetable soup', notes: 'Eat smaller, frequent meals. No late dinner.' },
                    { day: 'Day 7', focus: 'Review & Plan', breakfast: 'Idli with sambar', lunch: 'Balanced thali (small portions)', dinner: 'Grilled vegetables', notes: 'Check glucose levels. Plan next week.' }
                ]
            };
        }

        // HYPERTENSION/CVD PLAN (DASH DIET)
        if (highRiskConditions.includes('hypertension') || highRiskConditions.includes('cvd')) {
            return {
                name: 'Cardiac Care - 7 Day DASH Plan',
                description: 'Personalized for High Blood Pressure/Heart Disease Risk',
                riskLevel: 'High',
                primaryCondition: 'Hypertension/CVD',
                days: [
                    { day: 'Day 1', focus: 'Low Sodium Start', breakfast: 'Oatmeal with banana & walnuts', lunch: 'Fresh salad with grilled chicken (no salt)', dinner: 'Steamed fish with vegetables', notes: 'Limit sodium to 1500mg. Remove salt shaker.' },
                    { day: 'Day 2', focus: 'Potassium Rich', breakfast: 'Smoothie with spinach, banana, berries', lunch: 'Sweet potato with beans & greens', dinner: 'Dal with lots of vegetables', notes: 'Potassium helps lower BP. Avoid pickles.' },
                    { day: 'Day 3', focus: 'Heart-Healthy Fats', breakfast: 'Whole grain toast with avocado', lunch: 'Salmon with quinoa & asparagus', dinner: 'Vegetable stir-fry with olive oil', notes: 'Use olive oil. No fried foods.' },
                    { day: 'Day 4', focus: 'Magnesium Boost', breakfast: 'Greek yogurt with almonds & pumpkin seeds', lunch: 'Brown rice with rajma & salad', dinner: 'Spinach soup with whole grain bread', notes: 'Magnesium relaxes blood vessels.' },
                    { day: 'Day 5', focus: 'Lean Protein', breakfast: 'Egg white omelette with vegetables', lunch: 'Grilled chicken breast with vegetables', dinner: 'Moong dal with minimal salt', notes: 'Choose lean proteins. Monitor BP.' },
                    { day: 'Day 6', focus: 'Antioxidant Rich', breakfast: 'Berry smoothie bowl', lunch: 'Colorful vegetable salad with chickpeas', dinner: 'Tomato soup with herbs', notes: 'Berries protect heart. No processed foods.' },
                    { day: 'Day 7', focus: 'Stress Management', breakfast: 'Oats with fruits', lunch: 'Light vegetarian meal', dinner: 'Clear vegetable soup', notes: 'Practice deep breathing. Review BP readings.' }
                ]
            };
        }

        // DYSLIPIDEMIA (CHOLESTEROL) PLAN
        if (highRiskConditions.includes('dyslipidemia')) {
            return {
                name: 'Cholesterol Management - 7 Day Plan',
                description: 'Personalized for High Cholesterol Risk',
                riskLevel: 'High',
                primaryCondition: 'Dyslipidemia',
                days: [
                    { day: 'Day 1', focus: 'Soluble Fiber', breakfast: 'Oats with apples & cinnamon', lunch: 'Barley soup with vegetables', dinner: 'Bean salad with olive oil', notes: 'Soluble fiber lowers LDL. Avoid ghee.' },
                    { day: 'Day 2', focus: 'Omega-3 Boost', breakfast: 'Flaxseed smoothie', lunch: 'Grilled fish (salmon/mackerel)', dinner: 'Walnuts & vegetable stir-fry', notes: 'Omega-3 improves HDL cholesterol.' },
                    { day: 'Day 3', focus: 'Plant Sterols', breakfast: 'Whole grain cereal with soy milk', lunch: 'Chickpea curry with vegetables', dinner: 'Tofu with steamed greens', notes: 'Plant sterols block cholesterol absorption.' },
                    { day: 'Day 4', focus: 'Healthy Fats', breakfast: 'Avocado toast on whole grain', lunch: 'Salad with olive oil & nuts', dinner: 'Grilled vegetables with almonds', notes: 'Replace saturated fats with unsaturated.' },
                    { day: 'Day 5', focus: 'Limit Dietary Cholesterol', breakfast: 'Egg whites with vegetables', lunch: 'Lentil soup with salad', dinner: 'Vegetable khichdi', notes: 'Limit egg yolks. No organ meats.' },
                    { day: 'Day 6', focus: 'Antioxidants', breakfast: 'Berry smoothie with oats', lunch: 'Colorful vegetable curry', dinner: 'Green tea & light soup', notes: 'Antioxidants prevent cholesterol oxidation.' },
                    { day: 'Day 7', focus: 'Review & Test', breakfast: 'Oatmeal with fruits', lunch: 'Balanced vegetarian meal', dinner: 'Light dinner', notes: 'Schedule lipid profile test.' }
                ]
            };
        }

        // THYROID SUPPORT PLAN
        if (highRiskConditions.includes('thyroid')) {
            return {
                name: 'Thyroid Support - 7 Day Plan',
                description: 'Personalized for Thyroid Risk',
                riskLevel: 'High',
                primaryCondition: 'Thyroid',
                days: [
                    { day: 'Day 1', focus: 'Iodine Intake', breakfast: 'Scrambled eggs with iodized salt', lunch: 'Fish curry with vegetables', dinner: 'Dairy-based soup', notes: 'Essential for thyroid hormone production.' },
                    { day: 'Day 2', focus: 'Selenium Rich', breakfast: 'Brazil nuts (2-3) with yogurt', lunch: 'Chicken with brown rice', dinner: 'Egg curry with vegetables', notes: 'Selenium supports thyroid function.' },
                    { day: 'Day 3', focus: 'Zinc & Iron', breakfast: 'Fortified cereal with milk', lunch: 'Spinach dal with roti', dinner: 'Lean meat with vegetables', notes: 'Zinc and iron are crucial for thyroid.' },
                    { day: 'Day 4', focus: 'Cooked Cruciferous', breakfast: 'Omelette with cooked broccoli', lunch: 'Cooked cauliflower curry', dinner: 'Cabbage soup (well-cooked)', notes: 'Cook cruciferous vegetables thoroughly.' },
                    { day: 'Day 5', focus: 'Avoid Goitrogens', breakfast: 'Rice porridge with nuts', lunch: 'Non-soy protein with vegetables', dinner: 'Fish with steamed vegetables', notes: 'Limit raw soy if hypothyroid.' },
                    { day: 'Day 6', focus: 'Vitamin D', breakfast: 'Fortified milk with cereal', lunch: 'Fatty fish with salad', dinner: 'Mushroom soup', notes: 'Get 15 mins sunlight. Vitamin D important.' },
                    { day: 'Day 7', focus: 'Balanced Nutrition', breakfast: 'Balanced breakfast', lunch: 'Complete meal with variety', dinner: 'Light dinner', notes: 'Monitor symptoms. Consult endocrinologist.' }
                ]
            };
        }

        // MODERATE RISK - PREVENTATIVE PLAN
        return {
            name: 'Preventative Care - 7 Day Plan',
            description: 'Personalized for Moderate Risk',
            riskLevel: 'Moderate',
            primaryCondition: 'Prevention',
            days: [
                { day: 'Day 1', focus: 'Rainbow Nutrition', breakfast: 'Colorful fruit bowl with yogurt', lunch: 'Mixed vegetable salad with protein', dinner: 'Variety of cooked vegetables', notes: 'Eat 5 different colored foods daily.' },
                { day: 'Day 2', focus: 'Whole Foods', breakfast: 'Whole grain toast with nut butter', lunch: 'Brown rice with dal & vegetables', dinner: 'Quinoa with mixed vegetables', notes: 'Choose whole over processed foods.' },
                { day: 'Day 3', focus: 'Hydration', breakfast: 'Smoothie with greens', lunch: 'Soup with whole grain bread', dinner: 'Light curry with salad', notes: 'Drink 8-10 glasses of water.' },
                { day: 'Day 4', focus: 'Protein Variety', breakfast: 'Eggs with vegetables', lunch: 'Chicken/fish with salad', dinner: 'Lentil soup', notes: 'Vary protein sources throughout week.' },
                { day: 'Day 5', focus: 'Healthy Snacking', breakfast: 'Oats with fruits', lunch: 'Regular balanced meal', dinner: 'Light dinner', notes: 'Snack on nuts, fruits instead of chips.' },
                { day: 'Day 6', focus: 'Mindful Eating', breakfast: 'Balanced breakfast', lunch: 'Eat slowly, chew well', dinner: 'Light dinner', notes: 'Practice portion control.' },
                { day: 'Day 7', focus: 'Weekly Review', breakfast: 'Favorite healthy breakfast', lunch: 'Balanced meal', dinner: 'Light dinner', notes: 'Plan healthy meals for next week.' }
            ]
        };
    };

    // Watch Sync State
    const [showDeviceModal, setShowDeviceModal] = useState(false);
    const [scannedDevices, setScannedDevices] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [activeSymptom, setActiveSymptom] = useState(null);

    const startScan = () => {
        setShowDeviceModal(true);
        setIsScanning(true);
        setScannedDevices([]);

        // Simulate Scanning
        setTimeout(() => {
            setScannedDevices([
                { name: 'Apple Watch Series 8', id: 'aw8', signal: 'Strong', battery: '85%' },
                { name: 'Galaxy Watch 5', id: 'gw5', signal: 'Good', battery: '60%' },
                { name: 'Fitbit Charge 5', id: 'fb5', signal: 'Weak', battery: '40%' },
            ]);
            setIsScanning(false);
        }, 2000);
    };

    const connectAndSync = async (deviceName) => {
        setShowDeviceModal(false);
        const tid = toast.loading(`Connecting to ${deviceName}...`);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate connection
            toast.loading('Syncing health data...', { id: tid });

            // Generate realistic mock data
            const mockData = [
                { type: 'vitals', unit: 'bpm', val: Math.floor(65 + Math.random() * 20), notes: `Synced from ${deviceName} (Resting)` },
                { type: 'vitals', unit: 'mg/dL', val: Math.floor(95 + Math.random() * 15), notes: `Synced from ${deviceName}` },
                { type: 'vitals', unit: 'mmHg', val: `${Math.floor(115 + Math.random() * 10)}/${Math.floor(75 + Math.random() * 5)}`, notes: `Synced from ${deviceName}` },
                { type: 'sleep', unit: 'hours', val: (6 + Math.random() * 2).toFixed(1), notes: `Synced from ${deviceName}` },
                { type: 'activity', unit: 'steps', val: Math.floor(2000 + Math.random() * 5000), notes: `Synced from ${deviceName}` }
            ];

            const entries = mockData.map(d => ({
                patient_id: patient.id,
                log_type: d.type,
                value: d.val.toString(),
                notes: `Unit: ${d.unit} | ${d.notes}`,
                created_at: new Date().toISOString()
            }));

            const { error } = await supabase.from('tracker_logs').insert(entries);
            if (error) throw error;

            toast.success(`Successfully synced with ${deviceName}!`, { id: tid });
            loadData(); // Refresh UI

        } catch (error) {
            console.error(error);
            toast.error('Sync failed: Connection lost', { id: tid });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-800 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-surface pb-20 relative">

            {/* Device Selection Modal */}
            {showDeviceModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-[#4a2b3d] uppercase tracking-widest flex items-center gap-2">
                                <Watch size={24} className="text-teal-600" /> Nearby Devices
                            </h3>
                            <button onClick={() => setShowDeviceModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {isScanning ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
                                    <Watch className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-600 animate-pulse" size={24} />
                                </div>
                                <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Scanning for watches...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {scannedDevices.map(device => (
                                    <button
                                        key={device.id}
                                        onClick={() => connectAndSync(device.name)}
                                        className="w-full p-4 bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 rounded-2xl flex items-center gap-4 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-teal-600 group-hover:scale-110 transition-all">
                                            <Watch size={24} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h4 className="text-sm font-black text-slate-800">{device.name}</h4>
                                            <p className="text-xs font-bold text-slate-400">Battery: {device.battery} • Signal: {device.signal}</p>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:text-teal-600" size={20} />
                                    </button>
                                ))}
                                {scannedDevices.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm font-bold">No devices found.</div>
                                )}
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400 font-medium">Make sure your device is bluetooth visible.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white sticky top-0 z-30 border-b border-gray-200 shadow-sm px-6 py-4">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggle}
                            className="lg:hidden p-2 -ml-2 text-[#4a2b3d] hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <MoreVertical className="w-6 h-6" />
                        </button>
                        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 hover:text-teal-700 transition-colors">
                            <ChevronRight className="rotate-180" size={24} />
                        </button>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest">{trackerTitle}</h1>
                    <button
                        onClick={startScan}
                        className="p-2 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded-full transition-all group relative"
                        title="Sync with Watch"
                    >
                        <Watch size={20} className="group-hover:rotate-12 transition-transform" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-teal-500 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

                {/* Main Input Card */}
                <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-teal-900/10 border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    {!isSpecificMode && (
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {[
                                { name: 'PR Tracker', icon: Heart, href: '/patient/health-tracker?tab=pr', color: 'bg-orange-50 text-orange-600', key: 'vitals', unit: 'bpm' },
                                { name: 'Glucose', icon: Droplets, href: '/patient/health-tracker?tab=glucose', color: 'bg-blue-50 text-blue-600', key: 'vitals', unit: 'mg/dL' },
                                { name: 'BP Tracker', icon: Activity, href: '/patient/health-tracker?tab=bp', color: 'bg-teal-50 text-teal-600', key: 'vitals', unit: 'mmHg' },
                                { name: 'Steps', icon: Activity, href: '/patient/health-tracker?tab=steps', color: 'bg-amber-50 text-amber-600', key: 'activity' },
                                { name: 'Sleep', icon: Clock, href: '/patient/health-tracker?tab=sleep', color: 'bg-indigo-50 text-indigo-600', key: 'sleep' },
                                { name: 'Diet', icon: Utensils, href: '/patient/health-tracker?tab=diet', color: 'bg-emerald-50 text-emerald-600', key: 'diet' },
                                { name: 'Symptoms', icon: AlertCircle, href: '/patient/health-tracker?tab=symptoms', color: 'bg-rose-50 text-rose-600', key: 'symptoms' },
                                { name: 'Med', icon: Pill, href: '/patient/health-tracker?tab=med', color: 'bg-rose-50 text-rose-600', key: 'med' },
                                { name: 'Tests Result', icon: FileText, href: '/patient/health-tracker?tab=test', color: 'bg-purple-50 text-purple-600', key: 'test' },
                                { name: 'Follow-up', icon: Calendar, href: '/patient/health-tracker?tab=followup', color: 'bg-blue-50 text-blue-600', key: 'followup' },
                            ].map((item) => {
                                // Find latest log for this item
                                const latestLog = logs.find(log => {
                                    if (item.key === 'vitals') return log.log_type === 'vitals' && log.unit === item.unit;
                                    return log.log_type === item.key;
                                });

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95 text-center group min-h-[140px]"
                                    >
                                        <div className={`p-3 rounded-full ${item.color} group-hover:scale-110 transition-transform`}>
                                            <item.icon size={24} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.name}</span>
                                            {latestLog && latestLog.value && (
                                                <span className="text-sm font-black text-slate-800">
                                                    {latestLog.value} <span className="text-[10px] text-slate-400 font-bold ml-0.5">{latestLog.unit}</span>
                                                </span>
                                            )}
                                            {latestLog && !latestLog.value && latestLog.notes && (
                                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">
                                                    {latestLog.notes}
                                                </span>
                                            )}
                                            {!latestLog && <span className="text-[10px] font-bold text-gray-300">- -</span>}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {isSpecificMode && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <button
                                    onClick={() => router.push('/patient/health-tracker')}
                                    className="text-xs font-bold text-teal-600 flex items-center gap-1 hover:underline"
                                >
                                    <ChevronRight className="rotate-180 w-4 h-4" /> Change Tracker
                                </button>
                            </div>

                            {/* ------------ SYMPTOMS TRACKER UI ------------ */}
                            {formData.log_type === 'symptoms' ? (
                                <div className="space-y-8">
                                    {/* Medical Notice Alert */}
                                    <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-xl">
                                        <h4 className="flex items-center gap-2 text-rose-800 font-bold mb-2">
                                            <AlertTriangle size={20} /> Important Medical Notice
                                        </h4>
                                        <ul className="list-disc list-inside text-rose-700 text-sm space-y-1 font-medium">
                                            <li>This tracker helps you record symptoms to discuss with your doctor.</li>
                                            <li>If you experience severe symptoms like chest pain or difficulty breathing, seek immediate medical attention.</li>
                                            <li>Patterns over time are more useful than single events.</li>
                                        </ul>
                                    </div>

                                    {/* Symptom Pills */}
                                    <div>
                                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Activity className="text-teal-600" size={18} /> Log New Symptom
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {['Headache', 'Dizziness', 'Fatigue', 'Nausea', 'Joint Pain', 'Shortness of Breath', 'Chest Pain', 'Fever', 'Cough', 'Other'].map(symptom => (
                                                <button
                                                    key={symptom}
                                                    onClick={() => {
                                                        setActiveSymptom(symptom);
                                                        setFormData({ ...formData, value: symptom });
                                                    }}
                                                    className={`py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 ${activeSymptom === symptom
                                                        ? 'bg-teal-600 text-white border-teal-600 shadow-lg scale-105'
                                                        : 'bg-white text-slate-500 border-slate-100 hover:border-teal-200 hover:text-teal-600'
                                                        }`}
                                                >
                                                    {symptom}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Dynamic Inputs for Selected Symptom */}
                                    {activeSymptom && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in slide-in-from-top-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-slate-800">{activeSymptom === 'Other' ? 'Specify Symptom' : `${activeSymptom} Details`}</h4>
                                                <button onClick={() => setActiveSymptom(null)} className="text-slate-400 hover:text-rose-500"><X size={18} /></button>
                                            </div>
                                            {activeSymptom === 'Other' && (
                                                <div className="mb-4">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Symptom Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Rash, Sore Throat"
                                                        className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 focus:border-teal-500 outline-none"
                                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Severity</label>
                                                    <select
                                                        className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 focus:border-teal-500 outline-none"
                                                        onChange={(e) => setFormData({ ...formData, notes: `Severity: ${e.target.value} | ${formData.notes.split('|').slice(1).join('|')}` })}
                                                    >
                                                        <option value="Mild">Mild</option>
                                                        <option value="Moderate">Moderate</option>
                                                        <option value="Severe">Severe</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Duration</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 2 hours"
                                                        className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 focus:border-teal-500 outline-none"
                                                        onChange={(e) => {
                                                            const parts = formData.notes.split('|');
                                                            const severity = parts[0] || 'Severity: Mild';
                                                            const notes = parts.slice(2).join('|') || '';
                                                            setFormData({ ...formData, notes: `${severity} | Duration: ${e.target.value} | ${notes}` });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <textarea
                                                placeholder="Additional notes..."
                                                className="w-full p-3 rounded-xl border border-slate-200 font-medium text-slate-600 focus:border-teal-500 outline-none h-24 resize-none"
                                                value={formData.notes.split('|')[2] || ''}
                                                onChange={(e) => {
                                                    const parts = formData.notes.split('|');
                                                    const prefix = parts.slice(0, 2).join('|') || 'Severity: Mild | Duration: --';
                                                    setFormData({ ...formData, notes: `${prefix} | ${e.target.value}` });
                                                }}
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSave}
                                        className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:bg-teal-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save size={20} /> Log Symptom
                                    </button>
                                </div>
                            ) : formData.log_type === 'followup' ? (
                                /* ------------ FOLLOW-UP INSTRUCTIONS UI ------------ */
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-3 bg-[#4a2b3d] rounded-xl text-white">
                                            <ClipboardList size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-[#4a2b3d] uppercase tracking-tight">Follow-up Instructions</h2>
                                            <p className="text-xs text-slate-500 font-bold">Care plan from your healthcare provider</p>
                                        </div>
                                    </div>

                                    {/* Next Appointment Card */}
                                    {/* Next Appointment Card */}
                                    <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
                                        <h4 className="text-[#4a2b3d] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Calendar size={18} /> Next Appointment
                                        </h4>
                                        {nextAppointment ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Date</p>
                                                    <p className="text-lg font-black text-slate-800">
                                                        {nextAppointment?.appointment_date ? new Date(nextAppointment.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Time</p>
                                                    <p className="text-lg font-black text-slate-800">{nextAppointment.appointment_time}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Purpose</p>
                                                    <p className="text-lg font-black text-slate-800">{nextAppointment.consultation_type || 'Consultation'}</p>
                                                    <p className="text-xs font-bold text-teal-600 mt-1">
                                                        {nextAppointment.doctors?.name?.toLowerCase().startsWith('dr') ? nextAppointment.doctors.name : `Dr. ${nextAppointment.doctors?.name}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-slate-500 font-bold">No upcoming appointments scheduled.</p>
                                                <button onClick={() => router.push('/patient/appointments')} className="text-teal-600 font-black text-xs uppercase tracking-widest mt-2 hover:underline">Book Now</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Care Instructions List */}
                                    <div>
                                        <h4 className="text-[#4a2b3d] font-black uppercase tracking-widest mb-4">Care Instructions</h4>
                                        <div className="space-y-3">
                                            {[
                                                "Monitor blood pressure daily and record readings",
                                                "Continue current medications as prescribed",
                                                "Maintain food diary for 2 weeks",
                                                "Call office if symptoms worsen"
                                            ].map((instruction, idx) => (
                                                <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="w-8 h-8 rounded-full bg-[#4a2b3d] text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <p className="text-slate-700 font-bold text-sm">{instruction}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Medications Prescribed Section */}
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="p-6 border-b border-slate-100">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-[#5a8a7a] rounded-lg text-white">
                                                    <Pill size={20} />
                                                </div>
                                                <h3 className="text-lg font-black text-[#2D3748] tracking-tight">Medications Prescribed</h3>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Medications discussed during your visit. Never change your medication without consulting your doctor.
                                                This is a record only, not medical advice.
                                            </p>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-[#F8FAFC] text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4">Medication</th>
                                                        <th className="px-6 py-4">Dosage</th>
                                                        <th className="px-6 py-4">Frequency</th>
                                                        <th className="px-6 py-4">Timing</th>
                                                        <th className="px-6 py-4">Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {prescribedMeds.length > 0 ? (
                                                        prescribedMeds.map((med, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors bg-white">
                                                                <td className="px-6 py-4 font-black text-slate-800">{med.name}</td>
                                                                <td className="px-6 py-4 font-medium text-slate-600">{med.dosage}</td>
                                                                <td className="px-6 py-4 font-medium text-slate-600">{med.frequency}</td>
                                                                <td className="px-6 py-4 font-medium text-slate-600">{med.instructions}</td>
                                                                <td className="px-6 py-4 text-xs font-bold text-slate-400 italic">{med.duration || 'As prescribed'}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest bg-[#FDFDFD]">
                                                                No active medications found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>


                                </div>
                            ) : formData.log_type === 'med' ? (
                                /* ------------ MEDICATION TRACKER UI ------------ */
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-3 bg-teal-50 rounded-xl text-teal-700">
                                            <Pill size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-[#4a2b3d] uppercase tracking-tight">Medications Prescribed</h2>
                                            <p className="text-xs text-slate-500 font-bold">Track your daily intake</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-[#F8FAFC] text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4">Medication</th>
                                                        <th className="px-6 py-4">Dosage</th>
                                                        <th className="px-6 py-4">Frequency</th>
                                                        <th className="px-6 py-4">Timing</th>
                                                        <th className="px-4 py-4 text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">

                                                    {prescribedMeds.length > 0 ? (
                                                        prescribedMeds.map((med, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors bg-white">
                                                                <td className="px-6 py-4 font-black text-slate-800">{med.name}</td>
                                                                <td className="px-6 py-4 font-medium text-slate-600">{med.dosage}</td>
                                                                <td className="px-6 py-4 font-medium text-slate-600">{med.frequency}</td>
                                                                <td className="px-6 py-4 font-medium text-slate-600">{med.instructions}</td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <button
                                                                        onClick={() => instantLogMedication(med)}
                                                                        className="px-4 py-2 bg-[#4a2b3d] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#3a1b2d] active:scale-95 transition-all shadow-md shadow-[#4a2b3d]/10"
                                                                    >
                                                                        Log
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest bg-[#FDFDFD]">
                                                                No active medications found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : formData.log_type === 'test' ? (
                                /* ------------ TEST RESULTS UI ------------ */
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-3 bg-purple-50 rounded-xl text-purple-700">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-[#4a2b3d] uppercase tracking-tight">Test Results</h2>
                                            <p className="text-xs text-slate-500 font-bold">Latest laboratory reports</p>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-[#F8FAFC] text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4">Test Name</th>
                                                        <th className="px-6 py-4">Result</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {logs.filter(l => ['vitals', 'blood_sugar', 'cholesterol', 'test'].includes(l.log_type) || (l.notes && l.notes.toLowerCase().includes('pressure'))).length > 0 ? (
                                                        logs.filter(l => ['vitals', 'blood_sugar', 'cholesterol', 'test'].includes(l.log_type) || (l.notes && l.notes.toLowerCase().includes('pressure'))).slice(0, 10).map((test, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors bg-white">
                                                                <td className="px-6 py-4 font-black text-slate-800 capitalize">
                                                                    {test.log_type === 'vitals' ? 'Blood Pressure' : test.log_type.replace('_', ' ')}
                                                                </td>
                                                                <td className="px-6 py-4 font-medium text-slate-600">
                                                                    {test.value} <span className="text-slate-400 text-xs ml-1">{test.log_type === 'vitals' ? 'mmHg' : ''}</span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Normal</span>
                                                                </td>
                                                                <td className="px-6 py-4 font-medium text-slate-400">
                                                                    {test.created_at ? new Date(test.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest bg-[#FDFDFD]">
                                                                No recent test results available
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : formData.log_type === 'diet' ? (
                                /* ------------ DIET RECOMMENDATIONS UI ------------ */
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
                                            <Utensils size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-[#4a2b3d] uppercase tracking-tight">Diet Recommendations</h2>
                                            <p className="text-xs text-slate-500 font-bold">Dietary suggestions from your healthcare provider</p>
                                        </div>
                                    </div>

                                    {/* Medical Disclaimer */}
                                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
                                        <p className="text-amber-800 text-xs font-bold flex items-center gap-2">
                                            <Info size={16} /> Always discuss diet changes with your doctor or nutritionist.
                                        </p>
                                    </div>

                                    {(() => {
                                        const dietPlan = getDietPlan(latestAssessment);
                                        return (
                                            <>
                                                {/* Plan Header */}
                                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-black text-[#4a2b3d] mb-2">{dietPlan.name}</h3>
                                                            <p className="text-sm text-slate-600 font-medium">{dietPlan.description}</p>
                                                        </div>
                                                        {dietPlan.riskLevel && (
                                                            <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${dietPlan.riskLevel === 'High' ? 'bg-rose-100 text-rose-700' :
                                                                dietPlan.riskLevel === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {dietPlan.riskLevel} Risk
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 7-Day Action Plan Table */}
                                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-sm">
                                                            <thead className="bg-[#F8FAFC] text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                                                                <tr>
                                                                    <th className="px-6 py-4 w-24">Day</th>
                                                                    <th className="px-6 py-4">Daily Focus</th>
                                                                    <th className="px-6 py-4">Meals</th>
                                                                    <th className="px-6 py-4">Action Notes</th>
                                                                    <th className="px-6 py-4 w-48">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {dietPlan.days.map((dayPlan, idx) => (
                                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors bg-white">
                                                                        <td className="px-6 py-4">
                                                                            <span className="font-black text-[#4a2b3d] text-base">{dayPlan.day}</span>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <span className="font-bold text-teal-700 text-sm">{dayPlan.focus}</span>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <div className="space-y-1 text-xs">
                                                                                <div><span className="font-bold text-slate-500">B:</span> <span className="text-slate-700">{dayPlan.breakfast}</span></div>
                                                                                <div><span className="font-bold text-slate-500">L:</span> <span className="text-slate-700">{dayPlan.lunch}</span></div>
                                                                                <div><span className="font-bold text-slate-500">D:</span> <span className="text-slate-700">{dayPlan.dinner}</span></div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 font-medium text-slate-600 text-xs">{dayPlan.notes}</td>
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex flex-col gap-2">
                                                                                <button
                                                                                    onClick={() => handleAddDietReminder(dayPlan)}
                                                                                    className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-teal-200"
                                                                                >
                                                                                    <Bell size={12} /> Add Reminder
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleMarkDietComplete(dayPlan)}
                                                                                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-emerald-200"
                                                                                >
                                                                                    <Check size={12} /> Mark Complete
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            ) : (() => {
                                // Check if this is an auto-sync tracker (PR, Glucose, BP, Sleep, Steps)
                                const autoSyncTrackers = ['pr', 'glucose', 'bp', 'sleep', 'steps'];
                                const currentTab = searchParams.get('tab');
                                const isAutoSync = autoSyncTrackers.includes(currentTab);

                                if (isAutoSync) {
                                    // AUTO-SYNC TRACKER UI (No Manual Entry)
                                    const trackerConfig = {
                                        pr: { icon: Heart, color: 'orange', unit: 'bpm', label: 'Heart Rate', filterUnit: 'bpm' },
                                        glucose: { icon: Droplets, color: 'blue', unit: 'mg/dL', label: 'Blood Glucose', filterUnit: 'mg/dL' },
                                        bp: { icon: Activity, color: 'teal', unit: 'mmHg', label: 'Blood Pressure', filterUnit: 'mmHg' },
                                        sleep: { icon: Clock, color: 'indigo', unit: 'hours', label: 'Sleep Duration', filterUnit: 'hours' },
                                        steps: { icon: Activity, color: 'amber', unit: 'steps', label: 'Daily Steps', filterUnit: 'steps' }
                                    };

                                    const config = trackerConfig[currentTab];
                                    const Icon = config.icon;

                                    // Filter logs for this specific tracker
                                    const trackerLogs = logs.filter(l => {
                                        if (currentTab === 'pr' || currentTab === 'glucose' || currentTab === 'bp') {
                                            return l.log_type === 'vitals' && l.notes?.includes(config.filterUnit);
                                        }
                                        return l.log_type === (currentTab === 'steps' ? 'activity' : currentTab);
                                    }).slice(0, 10);

                                    return (
                                        <div className="space-y-6">
                                            {/* Sync Prompt */}
                                            <div className={`bg-gradient-to-r from-${config.color}-50 to-${config.color}-100 rounded-2xl p-6 border border-${config.color}-200`}>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className={`p-3 bg-white rounded-xl text-${config.color}-600 shadow-sm`}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-black text-slate-800">{config.label} Tracker</h3>
                                                        <p className="text-xs text-slate-600 font-medium">Automatically synced from your smartwatch</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={startScan}
                                                    className={`w-full py-4 bg-${config.color}-600 hover:bg-${config.color}-700 text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95`}
                                                >
                                                    <Watch size={20} /> Sync from Watch
                                                </button>
                                            </div>

                                            {/* Weekly Progress View */}
                                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Weekly Progress</h4>
                                                </div>
                                                <div className="p-6">
                                                    {trackerLogs.length > 0 ? (
                                                        <>
                                                            {/* Weekly Chart - Simple Bar Visualization */}
                                                            <div className="space-y-3 mb-6">
                                                                {(() => {
                                                                    // Get last 7 days of data
                                                                    const last7Days = [];
                                                                    const today = new Date();
                                                                    for (let i = 6; i >= 0; i--) {
                                                                        const date = new Date(today);
                                                                        date.setDate(date.getDate() - i);
                                                                        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                                        const dayLog = trackerLogs.find(l => {
                                                                            const logDate = new Date(l.created_at);
                                                                            return logDate.toDateString() === date.toDateString();
                                                                        });
                                                                        last7Days.push({ date: dateStr, value: dayLog?.value || null, fullDate: date });
                                                                    }

                                                                    const maxValue = Math.max(...trackerLogs.map(l => parseFloat(l.value) || 0));

                                                                    return last7Days.map((day, idx) => (
                                                                        <div key={idx} className="flex items-center gap-3">
                                                                            <span className="text-xs font-bold text-slate-500 w-16">{day.date}</span>
                                                                            <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden relative">
                                                                                {day.value && (
                                                                                    <div
                                                                                        className={`h-full bg-gradient-to-r from-${config.color}-400 to-${config.color}-600 rounded-full flex items-center justify-end pr-3 transition-all`}
                                                                                        style={{ width: `${(parseFloat(day.value) / maxValue) * 100}%` }}
                                                                                    >
                                                                                        <span className="text-xs font-black text-white">{day.value}</span>
                                                                                    </div>
                                                                                )}
                                                                                {!day.value && (
                                                                                    <div className="h-full flex items-center justify-center">
                                                                                        <span className="text-xs text-slate-300 font-medium">No data</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ));
                                                                })()}
                                                            </div>

                                                            {/* Latest Reading */}
                                                            <div className={`bg-gradient-to-r from-${config.color}-50 to-${config.color}-100 rounded-xl p-4 border border-${config.color}-200`}>
                                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Latest Reading</p>
                                                                <p className="text-3xl font-black text-slate-800">
                                                                    {trackerLogs[0].value} <span className="text-lg text-slate-500 font-medium">{config.unit}</span>
                                                                </p>
                                                                <p className="text-xs text-slate-500 font-medium mt-1">
                                                                    {trackerLogs?.[0]?.created_at ? new Date(trackerLogs[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="px-6 py-12 text-center">
                                                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${config.color}-50 flex items-center justify-center text-${config.color}-300`}>
                                                                <Icon size={32} />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-400 mb-2">No readings yet</p>
                                                            <p className="text-xs text-slate-400">Sync your smartwatch to see your weekly {config.label.toLowerCase()} progress</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // STANDARD/GENERIC TRACKER UI (Manual Entry for other trackers)
                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1">Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                    <input
                                                        type="date"
                                                        value={formData.date}
                                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                        className="w-full bg-white border-2 border-slate-200 focus:border-teal-600 rounded-xl py-4 pl-12 pr-4 text-base font-bold text-slate-900 outline-none transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1">Time</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                    <input
                                                        type="time"
                                                        value={formData.time}
                                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                                        className="w-full bg-white border-2 border-slate-200 focus:border-teal-600 rounded-xl py-4 pl-12 pr-4 text-base font-bold text-slate-900 outline-none transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 mb-8">
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    placeholder={trackerPlaceholder}
                                                    value={formData.value}
                                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                                    className="w-full text-4xl font-black text-slate-900 placeholder:text-slate-400 border-b-4 border-slate-200 focus:border-teal-600 py-6 bg-transparent outline-none transition-all"
                                                />
                                                {formData.unit && <span className="absolute right-0 bottom-6 text-sm font-black text-slate-500 uppercase tracking-widest">{formData.unit}</span>}
                                            </div>

                                            <div className="relative">
                                                {isListening ? (
                                                    <div className="w-full bg-teal-50 border-2 border-teal-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-40 animate-pulse transition-all">
                                                        <p className="text-teal-800 font-bold text-lg mb-2">Listening...</p>
                                                        <p className="text-teal-600 font-medium italic text-xl">"{transcript || 'Speak now'}"</p>
                                                    </div>
                                                ) : (
                                                    <textarea
                                                        placeholder="Add notes or speak..."
                                                        value={formData.notes}
                                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-base font-medium text-slate-900 placeholder:text-slate-500 focus:border-teal-600 focus:ring-0 outline-none resize-none h-40 shadow-sm transition-all"
                                                    />
                                                )}
                                                <button
                                                    onClick={toggleVoiceInput}
                                                    title={isListening ? "Stop Listening" : "Start Voice Input"}
                                                    className={`absolute right-4 bottom-4 p-3 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50 shadow-lg scale-110' : 'bg-slate-100 text-teal-700 border border-teal-200 hover:bg-teal-50'}`}
                                                >
                                                    {isListening ? <Activity className="animate-bounce" size={24} /> : <Mic size={24} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Camera Section */}
                                        <div className="mb-8">
                                            {capturedImage ? (
                                                <div className="relative rounded-2xl overflow-hidden aspect-video border-4 border-teal-100">
                                                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                                                    <button onClick={() => setCapturedImage(null)} className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black"><X size={20} /></button>
                                                </div>
                                            ) : showCamera ? (
                                                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border-4 border-teal-600">
                                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                                    <button onClick={capturePhoto} className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full p-4 shadow-xl border-4 border-teal-600 hover:scale-105 transition-transform"><div className="w-4 h-4 bg-teal-600 rounded-full" /></button>
                                                    <button onClick={() => setShowCamera(false)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black"><X size={24} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={startCamera}
                                                        className="flex-1 py-6 border-4 border-dashed border-slate-300 rounded-2xl text-slate-600 font-bold text-sm uppercase tracking-widest hover:border-teal-500 hover:text-teal-800 hover:bg-teal-50 transition-all flex flex-col items-center justify-center gap-2 bg-slate-50"
                                                    >
                                                        <Camera size={24} /> Take Photo
                                                    </button>
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex-1 py-6 border-4 border-dashed border-slate-300 rounded-2xl text-slate-600 font-bold text-sm uppercase tracking-widest hover:border-teal-500 hover:text-teal-800 hover:bg-teal-50 transition-all flex flex-col items-center justify-center gap-2 bg-slate-50"
                                                    >
                                                        <Upload size={24} /> Upload Photo
                                                    </button>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleFileUpload}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleSave}
                                            className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:bg-teal-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Save size={20} /> Save Log Entry
                                        </button>
                                    </>
                                );
                            })()}
                        </>
                    )}
                </div>




                {/* Recent Logs & Analytics */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-black text-slate-900 uppercase tracking-widest">Recent Activity</h2>
                        <button className="text-xs font-black text-teal-700 uppercase tracking-widest hover:underline hover:text-teal-900">View All</button>
                    </div>

                    <div className="space-y-4">
                        {logs.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
                                <div className="text-slate-400 font-medium">No logs yet. Start tracking today!</div>
                            </div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${log.log_type === 'vitals' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                        log.log_type === 'diet' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                            'bg-blue-50 border-blue-100 text-blue-600'
                                        }`}>
                                        {log.log_type === 'vitals' ? <Heart size={24} /> : log.log_type === 'diet' ? <Utensils size={24} /> : <Activity size={24} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{log.log_type}</span>
                                            <span className="text-xs font-bold text-slate-500">{log?.created_at ? new Date(log.created_at).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <p className="text-base font-bold text-slate-700 truncate">
                                            {log.value ? <span className="text-slate-900 mr-2">{log.value} {log.unit}</span> : null}
                                            {log.notes && <span className="text-slate-600 font-normal italic">- {log.notes}</span>}
                                        </p>
                                    </div>
                                    {log.image_url && (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                            <img src={log.image_url} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
}
