'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function ConsentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const date = new Date().toLocaleDateString('en-US');

    const handleAccept = async () => {
        setLoading(true);
        try {
            // Update patient profile to mark onboarding as complete if needed
            // For now, just redirect to dashboard
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Optional: Save consent timestamp to database
            }
            toast.success("Welcome to HealthON!");
            router.push('/patient/dashboard');
        } catch (error) {
            console.error(error);
            router.push('/patient/dashboard'); // Fallback
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans p-6 md:p-12 flex flex-col items-center">
            <div className="max-w-3xl w-full">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-4xl font-black text-[#5D2A42] mb-4">Privacy & Consent</h1>
                    <p className="text-slate-500 font-bold">Last updated: {date}</p>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8 max-h-[60vh] overflow-y-auto space-y-6 text-slate-700 leading-relaxed shadow-inner custom-scrollbar">

                    <p className="font-bold text-lg">By using HealthON, you consent to the collection and use of your health data for awareness, tracking, and insights, as described below.</p>

                    <p>Your health data is personal. HealthON is built to respect that. This page explains what data we collect, why we collect it, how it’s used, and the choices you have.</p>

                    <section>
                        <h3 className="text-lg font-black text-[#5D2A42] mb-2">1. What HealthON Collects</h3>
                        <p>HealthON may collect the following information only when you choose to provide it:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Health & Lifestyle Data:</strong> Body readings (BP, sugar, weight), Connected device data, Medicines, Lab reports, Diet, habits, symptoms.</li>
                            <li><strong>Basic Account Information:</strong> Name, Age, Gender, Contact details.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-black text-[#5D2A42] mb-2">2. Why We Collect This Data</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Organize your health information in one place</li>
                            <li>Identify patterns and trends over time</li>
                            <li>Provide reminders and non-clinical insights</li>
                            <li>Help you understand improvements or changes</li>
                            <li>Support better conversations with professionals</li>
                        </ul>
                        <p className="mt-2 font-bold">HealthON does not sell your health data.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-black text-[#5D2A42] mb-2">3. AI & Insights Consent</h3>
                        <p>HealthON may use AI systems to analyze trends, highlight risks, and generate summaries.</p>
                        <p className="font-bold mt-2">AI insights:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Are informational, not medical advice</li>
                            <li>Do not diagnose or treat conditions</li>
                            <li>Work only on data you provide</li>
                        </ul>
                        <p className="mt-2 italic">By using HealthON, you consent to this processing.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-black text-[#5D2A42] mb-2">4. What HealthON Does NOT Do</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>We do not diagnose diseases</li>
                            <li>We do not provide treatment decisions</li>
                            <li>We do not share your personal health data without consent</li>
                            <li>We do not use your data for advertising targeting</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-black text-[#5D2A42] mb-2">5. Data Sharing</h3>
                        <p>Your data is shared only when necessary (e.g., service providers, legal requirements). Any sharing is limited and purpose-specific.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-black text-[#5D2A42] mb-2">6. Your Choices & Control</h3>
                        <p>You can view, edit, or delete your data at any time. You can withdraw consent by discontinuing use.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-black text-[#5D2A42] mb-2">7. Data Security</h3>
                        <p>We use reasonable measures to protect against unauthorized access, loss, or misuse.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-black text-[#5D2A42] mb-2">8. Children’s Privacy</h3>
                        <p>HealthON is for adults (18+). Responsible adults must manage data for family members.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-black text-[#5D2A42] mb-2">10. Contact Us</h3>
                        <p>📧 Email: contact@healthon.app</p>
                        <p>🌐 Website: healthon.app</p>
                    </section>
                </div>

                <div className="text-center pb-12">
                    <button
                        onClick={handleAccept}
                        disabled={loading}
                        className="bg-[#5D2A42] text-white px-12 py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-2xl shadow-[#5D2A42]/30 hover:bg-[#4a2135] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 w-full md:w-auto mx-auto"
                    >
                        {loading ? 'Processing...' : 'I Accept'}
                        {!loading && <CheckCircle2 />}
                    </button>
                    <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">
                        By clicking "I Accept", you agree to the Terms & Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}
