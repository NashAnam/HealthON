'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, AlertCircle } from 'lucide-react';

export default function PrivacyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#648C81]/20 shadow-sm">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-slate-600 hover:text-[#5D2A42] transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Home</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1">
                            <img src="/logo.png" alt="HealthON Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter uppercase">Health<span className="text-[#648C81]">ON</span></span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="container mx-auto px-6 py-16 max-w-4xl">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-[#648C81]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-[#648C81]" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Privacy & Consent</h1>
                    <p className="text-slate-600 font-medium">Last updated: January 15, 2026</p>
                </div>

                <div className="bg-[#5D2A42]/5 border-l-4 border-[#5D2A42] p-6 rounded-r-2xl mb-12">
                    <p className="text-lg font-bold text-[#5D2A42] mb-2">Your health data is personal. HealthON is built to respect that.</p>
                    <p className="text-slate-700">This page explains what data we collect, why we collect it, how it's used, and the choices you have.</p>
                    <p className="text-slate-700 font-bold mt-4">By using HealthON, you consent to the practices described below.</p>
                </div>

                <div className="bg-gradient-to-br from-[#648C81]/5 to-white p-8 md:p-12 rounded-[3rem] border border-[#648C81]/20 shadow-lg space-y-8">
                    <Section number="1" title="What HealthON Collects" icon={Database}>
                        <p>HealthON may collect the following information only when you choose to provide it:</p>

                        <div className="mt-4">
                            <h4 className="font-bold text-slate-900 mb-2">Health & Lifestyle Data</h4>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Body readings (such as BP, sugar values, weight, activity)</li>
                                <li>Data from connected devices or smartwatches (if enabled)</li>
                                <li>Medicines and prescription details entered by you</li>
                                <li>Lab reports uploaded by you</li>
                                <li>Diet, habits, and daily health inputs</li>
                                <li>Symptoms or wellness information you choose to record</li>
                            </ul>
                        </div>

                        <div className="mt-4">
                            <h4 className="font-bold text-slate-900 mb-2">Basic Account Information</h4>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Name or identifier</li>
                                <li>Age and gender</li>
                                <li>Contact details (if required for support)</li>
                            </ul>
                        </div>
                    </Section>

                    <Section number="2" title="Why We Collect This Data" icon={Eye}>
                        <p>Your data is used to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Organize your health information in one place</li>
                            <li>Identify patterns and trends over time</li>
                            <li>Provide reminders and non-clinical insights</li>
                            <li>Help you understand whether things are improving or changing</li>
                            <li>Support better conversations with healthcare professionals</li>
                        </ul>
                        <p className="mt-4 font-bold text-[#5D2A42]">HealthON does not sell your health data.</p>
                    </Section>

                    <Section number="3" title="AI & Insights Consent" icon={AlertCircle}>
                        <p>HealthON may use AI systems to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Analyze trends in your health data</li>
                            <li>Highlight potential risks</li>
                            <li>Generate summaries and insights</li>
                        </ul>

                        <div className="bg-[#648C81]/10 p-6 rounded-2xl border border-[#648C81]/30 mt-4">
                            <p className="font-bold text-slate-900 mb-2">AI insights:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Are informational, not medical advice</li>
                                <li>Do not diagnose or treat conditions</li>
                                <li>Work only on data you provide or connect</li>
                            </ul>
                        </div>

                        <p className="mt-4 font-bold text-[#5D2A42]">By using HealthON, you consent to this processing.</p>
                    </Section>

                    <Section number="4" title="What HealthON Does NOT Do" icon={Lock}>
                        <ul className="list-disc list-inside space-y-2">
                            <li className="font-bold text-[#5D2A42]">We do not diagnose diseases</li>
                            <li className="font-bold text-[#5D2A42]">We do not provide treatment decisions</li>
                            <li className="font-bold text-[#5D2A42]">We do not share your personal health data without consent</li>
                            <li className="font-bold text-[#5D2A42]">We do not use your data for advertising targeting</li>
                        </ul>
                    </Section>

                    <Section number="5" title="Data Sharing">
                        <p>Your data is shared only when necessary, such as:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>With service providers who help run the app securely</li>
                            <li>When required by law</li>
                        </ul>
                        <p className="mt-4">Any sharing is limited, protected, and purpose-specific.</p>
                    </Section>

                    <Section number="6" title="Your Choices & Control" icon={UserCheck}>
                        <p className="font-bold text-[#648C81] mb-3">You can:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>View your data in the app</li>
                            <li>Edit or update information</li>
                            <li>Delete specific entries</li>
                            <li>Request account and data deletion</li>
                            <li>Withdraw consent at any time by discontinuing use or contacting us</li>
                        </ul>
                    </Section>

                    <Section number="7" title="Data Security" icon={Shield}>
                        <p>We use reasonable technical and organizational measures to protect your data against:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Unauthorized access</li>
                            <li>Loss or misuse</li>
                        </ul>
                        <p className="mt-4 text-slate-600 italic">No system is 100% secure, but protecting your data is a priority.</p>
                    </Section>

                    <Section number="8" title="Children's Privacy">
                        <p>HealthON is intended for adults (18+).</p>
                        <p className="mt-2">If used for family members, a responsible adult must manage the data and consent.</p>
                    </Section>

                    <Section number="9" title="Changes to This Policy">
                        <p>We may update this Privacy & Consent page to reflect improvements or regulatory changes.</p>
                        <p className="mt-2">Updates will be communicated in the app.</p>
                    </Section>

                    <Section number="10" title="Contact Us">
                        <div className="bg-[#648C81]/10 p-6 rounded-2xl border border-[#648C81]/30">
                            <p className="font-bold text-slate-900 mb-3">For questions or privacy requests:</p>
                            <p className="text-slate-700">📧 Email: <a href="mailto:contact@healthon.app" className="text-[#5D2A42] font-bold hover:underline">contact@healthon.app</a></p>
                            <p className="text-slate-700">🌐 Website: <a href="https://healthon.app" className="text-[#5D2A42] font-bold hover:underline">healthon.app</a></p>
                        </div>
                    </Section>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#5D2A42] text-white py-12 mt-16">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1 bg-white">
                            <img src="/logo.png" alt="HealthON Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter uppercase">Health<span className="text-[#648C81]">ON</span></span>
                    </div>
                    <p className="text-white/70 text-sm font-medium">
                        © 2025 HealthON. Know Early, Act Right, Save Life.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function Section({ number, title, icon: Icon, children }) {
    return (
        <div className="border-l-4 border-[#648C81] pl-6 py-2">
            <div className="flex items-start gap-3 mb-4">
                {Icon && <Icon className="w-5 h-5 text-[#648C81] mt-1 flex-shrink-0" />}
                <h2 className="text-2xl font-black text-slate-900">
                    {number}. {title}
                </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
                {children}
            </div>
        </div>
    );
}
