'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Activity, Thermometer, Droplets, Scale, AlertCircle, Calendar, Bell, ChevronRight, FileText, Pill, Stethoscope, Utensils, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser, getPatient, getLatestVitals, supabase, getAppointments, getReminders, createPatient, syncPatientReminders } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSidebar } from '@/lib/SidebarContext';
import { Menu, MoreVertical } from 'lucide-react';

export default function PatientDashboard() {
    const router = useRouter();
    const { toggle } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);
    const [user, setUser] = useState(null);
    const [patient, setPatient] = useState(null);
    const [vitals, setVitals] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [activity, setActivity] = useState([]);
    const [showTerms, setShowTerms] = useState(false);
    const [termsStep, setTermsStep] = useState(1);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const user = await getCurrentUser();

            // GUEST MODE - No user logged in
            if (!user) {
                setIsGuest(true);
                setLoading(false);
                return;
            }

            // AUTHENTICATED MODE
            setIsGuest(false);
            setUser(user);

            // Check for patient profile
            let { data: patientData } = await getPatient(user.id);

            // If no profile, create from login form data
            if (!patientData) {
                const pendingData = localStorage.getItem('pending_patient_data');
                if (pendingData) {
                    try {
                        const formData = JSON.parse(pendingData);
                        await createPatient({
                            user_id: user.id,
                            name: formData.name,
                            phone: formData.phone,
                            age: parseInt(formData.age),
                            email: user.email,
                            accepted_terms: false
                        });
                        localStorage.removeItem('pending_patient_data');
                        localStorage.setItem('returning_user', 'true');

                        // Reload patient data
                        const result = await getPatient(user.id);
                        patientData = result.data;
                    } catch (err) {
                        console.error('Error creating patient from pending data:', err);
                        setLoading(false);
                        return;
                    }
                } else {
                    // No pending data and no profile - redirect to login
                    router.push('/login');
                    return;
                }
            }

            setPatient(patientData);

            // Show Terms & Conditions if not accepted
            if (!patientData.accepted_terms) {
                setShowTerms(true);
                setLoading(false);
                return; // Don't load data until T&C accepted
            }

            // Fetch data in parallel
            const [vitalsRes, apptsRes, recordsRes, prescriptionsRes, remindersRes] = await Promise.all([
                getLatestVitals(patientData.id),
                getAppointments(patientData.id),
                supabase.from('lab_reports').select('*').eq('patient_id', patientData.id).order('created_at', { ascending: false }).limit(3),
                supabase.from('prescriptions').select('*').eq('patient_id', patientData.id).order('created_at', { ascending: false }).limit(3),
                getReminders(patientData.id),
                syncPatientReminders(patientData.id)
            ]);

            // Refresh reminders after sync (in case new ones were added)
            const { data: updatedReminders } = await getReminders(patientData.id);
            setVitals(vitalsRes.data);

            // Filter and sort for genuinely UPCOMING appointments (confirmed or pending)
            const todayStr = new Date().toISOString().split('T')[0];
            const upcomingAppts = (apptsRes.data || [])
                .filter(a => a.appointment_date >= todayStr && (a.status === 'confirmed' || a.status === 'pending'))
                .sort((a, b) => {
                    // Sort by date then time
                    if (a.appointment_date !== b.appointment_date) {
                        return a.appointment_date.localeCompare(b.appointment_date);
                    }
                    return (a.appointment_time || '').localeCompare(b.appointment_time || '');
                });

            setAppointments(upcomingAppts.slice(0, 3));
            setReminders(updatedReminders || remindersRes.data || []);


            // Combine for activity
            const activities = [];
            if (vitalsRes.data) {
                activities.push({
                    type: 'vitals',
                    title: 'Vitals recorded',
                    date: new Date(vitalsRes.data.recorded_at),
                    icon: Activity
                });
            }
            if (recordsRes.data) {
                recordsRes.data.forEach(report => {
                    activities.push({
                        type: 'report',
                        title: `Lab results uploaded: ${report.test_name || 'Report'}`,
                        date: new Date(report.created_at),
                        icon: FileText
                    });
                });
            }
            if (prescriptionsRes.data) {
                prescriptionsRes.data.forEach(rx => {
                    activities.push({
                        type: 'prescription',
                        title: 'Prescription written',
                        date: new Date(rx.created_at),
                        icon: Pill
                    });
                });
            }

            setActivity(activities.sort((a, b) => b.date - a.date).slice(0, 3));

            // Schedule unified notifications for all reminders & vitals
            try {
                const { scheduleAllReminders } = await import('@/lib/notifications');
                await scheduleAllReminders(patientData.id);
            } catch (notifError) {
                console.error('Notification scheduling error:', notifError);
            }

        } catch (error) {
            console.error('Dashboard load error:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleFeatureClick = (path) => {
        if (isGuest) {
            // Store the intended destination and redirect to login
            localStorage.setItem('redirect_after_login', path);
            router.push('/login');
        } else {
            // Authenticated user, go directly
            router.push(path);
        }
    };

    const handleAcceptTerms = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) {
                console.error('No user found');
                return;
            }
            const { error } = await supabase
                .from('patients')
                .update({ accepted_terms: true })
                .eq('id', patient.id);

            if (error) throw error;

            setShowTerms(false);
            toast.success('Welcome to CareOn!');

            // Check for pending redirect and navigate to intended feature
            const pendingPath = localStorage.getItem('redirect_after_login');
            if (pendingPath) {
                localStorage.removeItem('redirect_after_login');
                router.push(pendingPath);
            } else {
                // Reload dashboard to show data
                window.location.reload();
            }
        } catch (error) {
            console.error('Error accepting terms:', error);
            toast.error('Failed to accept terms. Please try again.');
        }
    };

    const calculateBMI = () => {
        const weight = vitals?.weight || patient?.weight;
        const height = patient?.height; // Assuming height in cm
        if (weight && height) {
            const heightInMeters = height / 100;
            return (weight / (heightInMeters * heightInMeters)).toFixed(1);
        }
        return '--';
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDF8FA]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4a2b3d]"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDF8FA] pb-10">
            {/* Terms & Conditions Overlay */}
            {showTerms && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8">
                    <div className="absolute inset-0 bg-[#4a2b3d]/60 backdrop-blur-md" />
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in fade-in zoom-in duration-500">
                        {/* Summary Side */}
                        <div className="md:w-1/3 bg-[#4a2b3d] p-10 flex flex-col justify-between text-white">
                            <div>
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                                    <AlertCircle className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tight leading-tight mb-4">Terms & Conditions</h2>
                                <p className="text-white/60 text-sm font-medium leading-relaxed">
                                    Please review and accept our medical disclaimer to access your dashboard.
                                </p>
                            </div>
                            <div className="pt-8 border-t border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Last Updated</p>
                                <p className="text-sm font-bold">January 2026</p>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-gray-50 flex flex-col">
                            <div className="flex-1 space-y-8 pb-8">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Medical Disclaimer</h3>
                                    <p className="text-lg font-bold text-slate-700 leading-relaxed">
                                        This Patient Portal is a health tracking and organization tool only. It helps you record and manage your health information to share with your healthcare providers.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-6">
                                        <div className="prose prose-sm max-w-none text-gray-600">
                                            {termsStep === 1 ? (
                                                <>
                                                    <h4 className="font-bold text-gray-900 text-lg">1. Purpose of HealthON</h4>
                                                    <p>HealthON is designed to support awareness, tracking, and early understanding of health patterns, especially related to chronic lifestyle conditions such as diabetes, hypertension, and cardiovascular risk. HealthON helps users organize health data, observe trends, and take informed action, but it does not replace medical care.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">2. Not a Medical Device or Diagnosis Tool</h4>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        <li>HealthON is not a medical device.</li>
                                                        <li>HealthON does not diagnose, treat, cure, or prevent any disease.</li>
                                                        <li>All insights, alerts, or summaries provided by HealthON are informational only.</li>
                                                        <li>Users must consult a qualified healthcare professional for diagnosis, treatment, or medical decisions.</li>
                                                    </ul>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">3. Use of Health Data</h4>
                                                    <p>HealthON may collect and process health-related data such as:</p>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        <li>Body measurements and vitals (manual or device-linked)</li>
                                                        <li>Lifestyle information (diet, activity, habits)</li>
                                                        <li>Medication intake details entered by the user</li>
                                                        <li>Lab report information uploaded by the user</li>
                                                    </ul>
                                                    <p className="mt-2">This data is used only to generate personal health insights and trends and is handled according to our Privacy Policy.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">4. Accuracy and User Responsibility</h4>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        <li>HealthON relies on user-provided information and connected device data.</li>
                                                        <li>Users are responsible for ensuring the accuracy and completeness of the data they enter.</li>
                                                        <li>HealthON cannot guarantee accuracy if data is incomplete, outdated, or incorrectly entered.</li>
                                                        <li>Decisions should never be made solely based on app information.</li>
                                                    </ul>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">5. AI-Generated Insights</h4>
                                                    <p>HealthON may use AI to identify patterns, highlight potential risks, and summarize health trends.</p>
                                                    <p className="font-semibold text-xs uppercase tracking-wide text-plum-700 mt-2">AI Insights Are:</p>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        <li>Supportive, not definitive</li>
                                                        <li>Not clinical judgments</li>
                                                        <li>May not account for all personal or medical factors</li>
                                                    </ul>
                                                    <p className="mt-2 font-bold">Always validate insights with a healthcare professional.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">6. Emergency Situations</h4>
                                                    <p className="text-red-600 font-bold">HealthON is not intended for approaches.</p>
                                                    <p>If you experience severe symptoms, sudden pain, loss of consciousness, or medical distress, <span className="font-bold underline">seek immediate medical attention or contact emergency services.</span></p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">7. External Services & Providers</h4>
                                                    <p>HealthON may help users discover doctors, labs, or health services. HealthON does not control or guarantee the quality, outcomes, or advice of external providers. Any engagement with third parties is at the user’s discretion.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">8. No Guaranteed Outcomes</h4>
                                                    <p>HealthON does not guarantee improved health outcomes, disease prevention, or risk reduction. Health outcomes depend on multiple factors, including medical care, lifestyle, and individual conditions.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">9. Eligibility</h4>
                                                    <p>HealthON is intended for adults aged 18 and above. Users must be capable of understanding health information. Parents or guardians must supervise usage if permitted for minors (if applicable).</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">10. Limitation of Liability</h4>
                                                    <p>To the extent permitted by law: HealthON is not liable for medical decisions made based on app content. HealthON is not responsible for harm resulting from misuse or misinterpretation of information. Use of the app is at the user’s own risk.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">11. Contact & Support</h4>
                                                    <p>For questions, concerns, or feedback:</p>
                                                    <p className="font-bold">📧 Email: contact@healthon.app</p>
                                                    <p className="font-bold">🌐 Website: healthon.app</p>
                                                </>
                                            ) : (
                                                <>
                                                    <h3 className="text-2xl font-black text-[#4a2b3d] mb-6">HealthON – Privacy & Consent</h3>
                                                    <p className="font-medium text-gray-500 mb-4">Last Updated: January 2026</p>
                                                    <p className="mb-6">Your health data is personal. HealthON is built to respect that. This page explains what data we collect, why we collect it, how it’s used, and the choices you have. By using HealthON, you consent to the practices described below.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">1. What HealthON Collects</h4>
                                                    <p>HealthON may collect the following information only when you choose to provide it:</p>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        <li><strong>Health & Lifestyle Data:</strong> Body readings, connected device data, medications, lab reports, diet, habits, symptoms.</li>
                                                        <li><strong>Basic Account Information:</strong> Name, age, gender, contact details.</li>
                                                    </ul>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">2. Why We Collect This Data</h4>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        <li>Organize your health information in one place</li>
                                                        <li>Identify patterns and trends over time</li>
                                                        <li>Provide reminders and non-clinical insights</li>
                                                        <li>Support better conversations with healthcare professionals</li>
                                                    </ul>
                                                    <p className="mt-2 font-bold text-plum-700">HealthON does not sell your health data.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">3. AI & Insights Consent</h4>
                                                    <p>HealthON may use AI systems to analyze trends, highlight risks, and generate summaries. AI insights are informational, not medical advice.</p>
                                                    <p className="mt-2">By using HealthON, you consent to this processing.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">4. What HealthON Does NOT Do</h4>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        <li>We do not diagnose diseases</li>
                                                        <li>We do not provide treatment decisions</li>
                                                        <li>We do not share your personal health data without consent</li>
                                                        <li>We do not use your data for advertising targeting</li>
                                                    </ul>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">5. Data Sharing</h4>
                                                    <p>Your data is shared only when necessary with secure service providers or when required by law.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">6. Your Choices & Control</h4>
                                                    <p>You can view, edit, or delete your data, and withdraw consent at any time.</p>

                                                    <h4 className="font-bold text-gray-900 text-lg mt-4">7. Contact Us</h4>
                                                    <p>For questions or privacy requests: contact@healthon.app</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {termsStep === 1 ? (
                                        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                                            <p className="text-sm font-bold text-rose-700 leading-relaxed italic text-center">
                                                In case of a medical emergency, please call your local emergency services immediately.
                                            </p>
                                        </div>
                                    ) : null}
                                </div>

                                <button
                                    onClick={() => {
                                        if (termsStep === 1) {
                                            setTermsStep(2);
                                        } else {
                                            handleAcceptTerms();
                                        }
                                    }}
                                    className="w-full py-5 bg-[#5a8a7a] hover:bg-[#4a7a6a] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#5a8a7a]/20 transition-all hover:scale-[1.02] active:scale-95 mt-4"
                                >
                                    {termsStep === 1 ? 'I Acknowledge & Accept' : 'I Consent & Enter Dashboard'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Decorative Ellipses (Blobs) - Right Side */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <motion.div
                    animate={{
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-[#5a8a7a]/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        x: [0, 40, 0],
                        y: [0, 60, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[10%] -right-[15%] w-[40%] h-[60%] bg-[#4a2b3d]/10 rounded-full blur-[100px]"
                />
            </div>

            {/* Refined Header */}
            <header className="bg-white px-6 md:px-12 py-6 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <div className="flex items-center gap-3 overflow-hidden">
                    <h1 className="text-lg md:text-2xl font-black text-[#4a2b3d] uppercase tracking-tight whitespace-nowrap truncate">
                        {user ? (patient?.name || 'Dashboard') : 'Guest'}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Simplified User Initial / Back to Home */}
                    <div
                        onClick={() => router.push('/')}
                        className="w-10 h-10 rounded-full bg-[#4a2b3d] flex items-center justify-center text-white font-black shadow-lg cursor-pointer hover:scale-105 transition-all text-sm"
                    >
                        {user ? (patient?.name?.[0] || 'U') : 'G'}
                    </div>

                    {/* Menu Ellipsis moved to right */}
                    <button
                        onClick={toggle}
                        className="p-2 text-[#4a2b3d] hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <MoreVertical className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="w-full max-w-7xl mx-auto px-6 md:px-12 py-8">

                {/* 2x2 Grid for Dashboard Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-8 mb-8">

                    {/* 1st: Health Assessment */}
                    <button
                        onClick={() => handleFeatureClick('/patient/assessment')}
                        className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4 md:gap-6 text-center hover:shadow-xl hover:border-[#5a8a7a]/30 transition-all group active:scale-95 min-h-[180px] md:min-h-[280px]"
                    >
                        <div className="w-14 h-14 md:w-20 md:h-20 bg-[#5a8a7a]/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-[#5a8a7a] group-hover:scale-110 group-hover:bg-[#5a8a7a] group-hover:text-white transition-all duration-300">
                            <FileText className="w-7 h-7 md:w-10 md:h-10" />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-2xl font-black text-[#4a2b3d] uppercase tracking-tight leading-tight">Health Assessment</h3>
                            <p className="hidden md:block text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest opacity-60">Analyze primary risks</p>
                        </div>
                    </button>

                    {/* 2nd: Health Tracker (Standard Style) */}
                    <button
                        onClick={() => handleFeatureClick('/patient/health-tracker')}
                        className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4 md:gap-6 text-center hover:shadow-xl hover:border-plum-100 transition-all group active:scale-95 min-h-[180px] md:min-h-[280px]"
                    >
                        <div className="w-14 h-14 md:w-20 md:h-20 bg-plum-50 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-plum-600 group-hover:scale-110 group-hover:bg-plum-600 group-hover:text-white transition-all duration-300">
                            <Activity className="w-7 h-7 md:w-10 md:h-10" />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-2xl font-black text-[#4a2b3d] uppercase tracking-tight leading-tight">Health Tracker</h3>
                            <p className="hidden md:block text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest opacity-60">Log vitals, diet & metrics</p>
                        </div>
                    </button>

                    {/* 3rd: Book Appointment */}
                    <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4 md:gap-6 text-center min-h-[180px] md:min-h-[280px]">
                        <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-50 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-blue-600">
                            <Calendar className="w-7 h-7 md:w-10 md:h-10" />
                        </div>
                        <h3 className="text-sm md:text-2xl font-black text-[#4a2b3d] uppercase tracking-tight leading-tight">Book Appointment</h3>
                        <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full mt-2">
                            <button
                                onClick={() => handleFeatureClick('/patient/doctor-booking')}
                                className="flex-1 bg-[#5a8a7a] text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] hover:shadow-lg active:scale-95 transition-all"
                            >
                                Doctor
                            </button>
                            <button
                                onClick={() => handleFeatureClick('/patient/lab-booking')}
                                className="flex-1 bg-[#4a2b3d] text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] hover:shadow-lg active:scale-95 transition-all"
                            >
                                Lab Test
                            </button>
                        </div>
                    </div>

                    {/* 4th: Weekly Progress */}
                    <button
                        onClick={() => handleFeatureClick('/patient/progress-report')}
                        className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4 md:gap-6 text-center hover:shadow-xl hover:border-rose-100 transition-all group active:scale-95 min-h-[180px] md:min-h-[280px]"
                    >
                        <div className="w-14 h-14 md:w-20 md:h-20 bg-rose-50 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-rose-600 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                            <Clock className="w-7 h-7 md:w-10 md:h-10" />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-2xl font-black text-[#4a2b3d] uppercase tracking-tight leading-tight">Weekly Progress</h3>
                            <p className="hidden md:block text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest opacity-60">View visual health trends</p>
                        </div>
                    </button>
                </div>

                {/* New Widgets: Appointments & Reminders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-[#4a2b3d] uppercase tracking-tight">Upcoming Appointments</h3>
                            <Calendar className="text-[#5a8a7a]" size={24} />
                        </div>
                        <div className="space-y-4">
                            {appointments.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm font-bold">No upcoming appointments.</div>
                            ) : (
                                appointments.map((appt, i) => (
                                    <div key={i} className="bg-emerald-50/50 p-4 rounded-2xl border-l-4 border-[#5a8a7a] flex justify-between items-center group hover:bg-emerald-50 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-slate-800">
                                                {appt.doctors?.name ? `Dr. ${appt.doctors.name}` : 'Doctor Visit'}
                                            </h4>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                {appt.appointment_date ? new Date(appt.appointment_date).toLocaleDateString('en-US') : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[#5a8a7a] font-black text-sm">{appt.appointment_time?.slice(0, 5)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button
                            onClick={() => handleFeatureClick('/patient/appointments')}
                            className="w-full mt-6 py-3 bg-[#5a8a7a] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#5a8a7a]/20 hover:bg-[#4a7a6a] transition-all"
                        >
                            View All Appointments
                        </button>
                    </div>

                    {/* Reminders */}
                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-[#4a2b3d] uppercase tracking-tight">Reminders</h3>
                            <Bell className="text-rose-600" size={24} />
                        </div>
                        <div className="space-y-4">
                            {(() => {
                                const activeReminders = reminders.filter(r => {
                                    // Show all active reminders regardless of time (checklist style)
                                    return true;
                                });

                                if (activeReminders.length === 0) {
                                    return <div className="text-center py-8 text-gray-400 text-sm font-bold">No active reminders.</div>;
                                }

                                return activeReminders.slice(0, 3).map((rem, i) => {
                                    const formatReminderTime = (timeStr) => {
                                        if (!timeStr) return '11:00 PM';
                                        if (timeStr.includes('T')) {
                                            const d = new Date(timeStr);
                                            return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                        }

                                        const cleanTime = timeStr.replace(/(AM|PM)/gi, '').trim();
                                        const parts = cleanTime.split(':');
                                        if (parts.length >= 2) {
                                            const hour = parseInt(parts[0]);
                                            const min = parts[1].substring(0, 2);
                                            const ampm = (timeStr.toLowerCase().includes('pm') || hour >= 12) ? 'PM' : 'AM';
                                            const h12 = hour % 12 || 12;
                                            return `${h12}:${min} ${ampm}`;
                                        }
                                        return timeStr;
                                    };

                                    return (
                                        <div key={i} className={`p-4 rounded-2xl border-l-4 flex justify-between items-center group hover:opacity-100 transition-colors ${rem.reminder_type === 'medication' ? 'bg-rose-50/50 border-rose-500 hover:bg-rose-50' : 'bg-blue-50/50 border-blue-500 hover:bg-blue-50'}`}>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{rem.title}</h4>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                    {rem.frequency}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-black text-sm ${rem.reminder_type === 'medication' ? 'text-rose-600' : 'text-blue-600'}`}>
                                                    {formatReminderTime(rem.reminder_time)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                        <button
                            onClick={() => handleFeatureClick('/patient/reminders')}
                            className="w-full mt-6 py-3 bg-[#4a2b3d] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#4a2b3d]/20 hover:bg-[#3a1b2d] transition-all"
                        >
                            View All Records
                        </button>
                    </div>
                </div>
                {/* Version Indicator */}
                <div className="text-center mt-12 mb-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        System Version 1.2 • build {new Date().toLocaleDateString()}
                    </p>
                </div>
            </main>
        </div>
    );
}
