'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Shield, Calendar, Activity, FileText, Video, Sparkles,
    ArrowRight, CheckCircle2, Users, TrendingUp, Heart, Stethoscope
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LandingPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const { supabase } = await import('@/lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', session.user.id).maybeSingle();
                if (doctor) return router.push('/doctor/dashboard');
                const { data: patient } = await supabase.from('patients').select('id').eq('user_id', session.user.id).maybeSingle();
                if (patient) return router.push('/patient/dashboard');
            }
        } catch (error) {
            console.error('Session check failed', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-teal-50/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src="/logo.png" alt="HealthON" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-black">
                            <span className="text-[#5D2A42]">Health</span>
                            <span className="text-[#648C81]">ON</span>
                        </span>
                    </div>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#5D2A42] to-[#4a2135] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:scale-105 transition-all"
                    >
                        Login
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#648C81]/10 to-[#5D2A42]/10 rounded-full mb-6 border border-[#648C81]/20">
                            <Sparkles className="w-4 h-4 text-[#648C81]" />
                            <span className="text-xs font-bold text-[#5D2A42] uppercase tracking-wider">AI-Powered Healthcare</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                            <span className="text-[#5D2A42]">Your Health,</span>
                            <br />
                            <span className="bg-gradient-to-r from-[#648C81] to-[#5D2A42] bg-clip-text text-transparent">Simplified</span>
                        </h1>
                        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Book appointments, consult with specialists, and manage your health records—all in one secure platform.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-10 py-4 bg-gradient-to-r from-[#5D2A42] to-[#4a2135] text-white rounded-2xl font-bold text-sm hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2 shadow-xl shadow-[#5D2A42]/30"
                        >
                            Get Started <ArrowRight size={18} />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Security Card */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-gradient-to-br from-[#5D2A42] to-[#4a2135] rounded-[2.5rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#648C81]/20 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black mb-4">Secure & Private</h2>
                            <p className="text-white/80 text-lg leading-relaxed max-w-2xl">
                                Your health data is encrypted and protected with industry-leading security standards. We never share your information without your explicit consent.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section - 4 Cards */}
            <section className="pt-20 pb-10 px-6 bg-white/50 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Everything you need
                        </h2>
                        <p className="text-gray-600 text-lg">Comprehensive tools for better health</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: <Calendar className="w-5 h-5 text-white" />,
                                title: 'Easy Appointments',
                                desc: 'Book consultations with specialists instantly.',
                                gradient: 'from-[#5D2A42] to-[#4a2135]'
                            },
                            {
                                icon: <Stethoscope className="w-5 h-5 text-white" />,
                                title: 'Expert Doctors',
                                desc: 'Connect with certified healthcare professionals.',
                                gradient: 'from-[#648C81] to-[#5a7a6f]'
                            },
                            {
                                icon: <FileText className="w-5 h-5 text-white" />,
                                title: 'Digital Records',
                                desc: 'All your medical history in one secure place.',
                                gradient: 'from-[#5D2A42] to-[#4a2135]'
                            },
                            {
                                icon: <Activity className="w-5 h-5 text-white" />,
                                title: 'Health Tracking',
                                desc: 'Monitor vitals, medications, and wellness goals.',
                                gradient: 'from-[#648C81] to-[#5a7a6f]'
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                                className="bg-white p-6 rounded-2xl border border-gray-100 flex items-start gap-4 hover:shadow-lg transition-all"
                            >
                                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 mb-1">{feature.title}</h3>
                                    <p className="text-sm text-gray-600">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Additional Features Grid */}
            <section className="pt-2 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: <Video className="w-5 h-5 text-white" />,
                                title: 'Telemedicine',
                                desc: 'Video consultations from anywhere',
                                gradient: 'from-[#5D2A42] to-[#4a2135]'
                            },
                            {
                                icon: <Heart className="w-5 h-5 text-white" />,
                                title: 'Health Insights',
                                desc: 'AI-powered health assessments',
                                gradient: 'from-[#648C81] to-[#5a7a6f]'
                            },
                            {
                                icon: <FileText className="w-5 h-5 text-white" />,
                                title: 'Prescriptions',
                                desc: 'Digital prescription management',
                                gradient: 'from-[#5D2A42] to-[#4a2135]'
                            },
                            {
                                icon: <Activity className="w-5 h-5 text-white" />,
                                title: 'Lab Reports',
                                desc: 'All your test results in one place',
                                gradient: 'from-[#648C81] to-[#5a7a6f]'
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 + i * 0.05 }}
                                className="bg-white p-6 rounded-2xl border border-gray-100 flex items-start gap-4 hover:shadow-lg transition-all"
                            >
                                <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 mb-1">{item.title}</h3>
                                    <p className="text-sm text-gray-600">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="bg-gradient-to-br from-[#5D2A42] via-[#4a2135] to-[#648C81] rounded-[2.5rem] p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5D2A42]/90 to-[#648C81]/90" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#648C81]/20 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black mb-6">
                                Ready to take<br />control of your health?
                            </h2>
                            <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
                                Join HealthON for comprehensive healthcare management.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="px-12 py-5 bg-white text-[#5D2A42] rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-2xl inline-flex items-center gap-2"
                            >
                                Start Your Journey <ArrowRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Contact Us</h2>
                    <p className="text-gray-600 text-lg mb-10">Have questions or need support? We're here to help.</p>

                    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <a href="mailto:contact@healthon.app" className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 hover:border-[#5D2A42] hover:shadow-xl transition-all group">
                            <div className="text-4xl mb-3">📧</div>
                            <h3 className="font-black text-gray-900 mb-2">Email</h3>
                            <p className="text-[#5D2A42] font-bold group-hover:underline">contact@healthon.app</p>
                        </a>

                        <a href="https://healthon.app" target="_blank" rel="noopener noreferrer" className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl border border-teal-200 hover:border-[#648C81] hover:shadow-xl transition-all group">
                            <div className="text-4xl mb-3">🌐</div>
                            <h3 className="font-black text-gray-900 mb-2">Website</h3>
                            <p className="text-[#648C81] font-bold group-hover:underline">healthon.app</p>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gradient-to-br from-gray-50 to-purple-50/30 py-12 px-6 border-t border-gray-200">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src="/logo.png" alt="HealthON" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-black">
                            <span className="text-[#5D2A42]">Health</span>
                            <span className="text-[#648C81]">ON</span>
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                        © 2026 HealthON. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}