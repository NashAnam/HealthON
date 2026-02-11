'use client';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TermsPage() {
    const router = useRouter();
    const date = new Date().toLocaleDateString('en-US');
    const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-[#5D2A42] font-bold mb-8 transition-colors">
                    <ChevronLeft /> Back
                </button>

                <h1 className="text-3xl md:text-4xl font-black mb-2 text-[#5D2A42]">HealthON – Legal Information</h1>
                <p className="text-slate-500 font-bold mb-8">Last updated: {date}</p>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`px-6 py-3 font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'terms'
                                ? 'text-[#5D2A42] border-b-4 border-[#5D2A42]'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Terms & Conditions
                    </button>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`px-6 py-3 font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'privacy'
                                ? 'text-[#5D2A42] border-b-4 border-[#5D2A42]'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Privacy & Consent
                    </button>
                </div>

                {/* Terms & Conditions Content */}
                {activeTab === 'terms' && (
                    <div className="space-y-8 text-base md:text-lg leading-relaxed text-slate-700">
                        <p>By using the HealthON app or services, you agree to the terms outlined below. Please read them carefully.</p>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">1. Purpose of HealthON</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>HealthON is designed to support awareness, tracking, and early understanding of health patterns, especially related to chronic lifestyle conditions such as diabetes, hypertension, and cardiovascular risk.</li>
                                <li>HealthON helps users organize health data, observe trends, and take informed action, but it does not replace medical care.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">2. Not a Medical Device or Diagnosis Tool</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>HealthON is not a medical device.</li>
                                <li>HealthON does not diagnose, treat, cure, or prevent any disease.</li>
                                <li>All insights, alerts, or summaries provided by HealthON are informational only.</li>
                                <li>Users must consult a qualified healthcare professional for diagnosis, treatment, or medical decisions.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">3. Use of Health Data</h2>
                            <p className="mb-2">HealthON may collect and process health-related data such as:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Body measurements and vitals (manual or device-linked)</li>
                                <li>Lifestyle information (diet, activity, habits)</li>
                                <li>Medication intake details entered by the user</li>
                                <li>Lab report information uploaded by the user</li>
                            </ul>
                            <p className="mt-2">This data is used only to generate personal health insights and trends and is handled according to our Privacy Policy.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">4. Accuracy and User Responsibility</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>HealthON relies on user-provided information and connected device data.</li>
                                <li>Users are responsible for ensuring the accuracy and completeness of the data they enter.</li>
                                <li>HealthON cannot guarantee accuracy if data is incomplete, outdated, or incorrectly entered.</li>
                                <li>Decisions should never be made solely based on app information.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">5. AI-Generated Insights</h2>
                            <p className="mb-2">HealthON may use AI to:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Identify patterns</li>
                                <li>Highlight potential risks</li>
                                <li>Summarize health trends</li>
                            </ul>
                            <p className="mt-2 font-bold">AI insights:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Are supportive, not definitive</li>
                                <li>Are not clinical judgments</li>
                                <li>May not account for all personal or medical factors</li>
                            </ul>
                            <p className="mt-2 font-black">Always validate insights with a healthcare professional.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">6. Emergency Situations</h2>
                            <p className="font-bold text-rose-600 mb-2">HealthON is not intended for emergencies.</p>
                            <p className="mb-2">If you experience:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Severe symptoms</li>
                                <li>Sudden pain</li>
                                <li>Loss of consciousness</li>
                                <li>Medical distress</li>
                            </ul>
                            <p className="mt-2 font-black text-rose-600">Seek immediate medical attention or contact emergency services.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">7. External Services & Providers</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>HealthON may help users discover doctors, labs, or health services and access third-party tools.</li>
                                <li>HealthON does not control or guarantee the quality, outcomes, or advice of external providers.</li>
                                <li>Any engagement with third parties is at the user's discretion.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">8. No Guaranteed Outcomes</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>HealthON does not guarantee improved health outcomes, disease prevention, or risk reduction.</li>
                                <li>Health outcomes depend on multiple factors, including medical care, lifestyle, and individual conditions.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">9. Eligibility</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>HealthON is intended for adults aged 18 and above.</li>
                                <li>Users must be capable of understanding health information.</li>
                                <li>Parents or guardians must supervise usage if permitted for minors.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">10. Limitation of Liability</h2>
                            <p>To the extent permitted by law:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>HealthON is not liable for medical decisions made based on app content.</li>
                                <li>HealthON is not responsible for harm resulting from misuse or misinterpretation of information.</li>
                                <li>Use of the app is at the user's own risk.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">11. Updates to HealthON</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>HealthON may update features, modify insights, improve algorithms, and change terms when required.</li>
                                <li>Continued use of the app indicates acceptance of updated terms.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">12. Contact & Support</h2>
                            <p>For questions, concerns, or feedback:</p>
                            <p>📧 Email: contact@healthon.app</p>
                            <p>🌐 Website: healthon.app</p>
                        </section>
                    </div>
                )}

                {/* Privacy & Consent Content */}
                {activeTab === 'privacy' && (
                    <div className="space-y-8 text-base md:text-lg leading-relaxed text-slate-700">
                        <p className="font-bold">By using HealthON, you consent to the collection and use of your health data for awareness, tracking, and insights, as described below.</p>

                        <p>Your health data is personal. HealthON is built to respect that. This page explains what data we collect, why we collect it, how it's used, and the choices you have.</p>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">1. What HealthON Collects</h2>
                            <p>HealthON may collect the following information only when you choose to provide it:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Health & Lifestyle Data:</strong> Body readings (BP, sugar, weight), Connected device data, Medicines, Lab reports, Diet, habits, symptoms.</li>
                                <li><strong>Basic Account Information:</strong> Name, Age, Gender, Contact details.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">2. Why We Collect This Data</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Organize your health information in one place</li>
                                <li>Identify patterns and trends over time</li>
                                <li>Provide reminders and non-clinical insights</li>
                                <li>Help you understand improvements or changes</li>
                                <li>Support better conversations with professionals</li>
                            </ul>
                            <p className="mt-2 font-bold text-[#5D2A42]">HealthON does not sell your health data.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">3. AI & Insights Consent</h2>
                            <p>HealthON may use AI systems to analyze trends, highlight risks, and generate summaries.</p>
                            <p className="font-bold mt-2">AI insights:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-1">
                                <li>Are informational, not medical advice</li>
                                <li>Do not diagnose or treat conditions</li>
                                <li>Work only on data you provide</li>
                            </ul>
                            <p className="mt-2 italic">By using HealthON, you consent to this processing.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">4. What HealthON Does NOT Do</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>We do not diagnose diseases</li>
                                <li>We do not provide treatment decisions</li>
                                <li>We do not share your personal health data without consent</li>
                                <li>We do not use your data for advertising targeting</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">5. Data Sharing</h2>
                            <p>Your data is shared only when necessary (e.g., service providers, legal requirements). Any sharing is limited and purpose-specific.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">6. Your Choices & Control</h2>
                            <p>You can view, edit, or delete your data at any time. You can withdraw consent by discontinuing use.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">7. Data Security</h2>
                            <p>We use reasonable measures to protect against unauthorized access, loss, or misuse.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">8. Children's Privacy</h2>
                            <p>HealthON is for adults (18+). Responsible adults must manage data for family members.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-[#5D2A42] mb-3">9. Contact Us</h2>
                            <p>📧 Email: contact@healthon.app</p>
                            <p>🌐 Website: healthon.app</p>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
