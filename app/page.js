'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Activity, Shield, Video, Lock, Zap, ArrowRight,
    CheckCircle2, Sparkles, Microscope, HeartPulse
} from 'lucide-react';
import { useState, useEffect } from 'react';

const FEATURES = [
    {
        title: "AI Health Risk Screening",
        desc: "Clinically validated assessments for early detection of heart risk, diabetes, and more.",
        icon: <Sparkles className="text-teal-600" />,
        link: "/patient/assessment"
    },
    {
        title: "HD Telemedicine",
        desc: "Secure, bidirectional video consultations with certified medical specialists from anywhere.",
        icon: <Video className="text-plum-600" />,
        link: "/patient/telemedicine/room"
    },
    {
        title: "Smart Medication Reminders",
        desc: "Unified medication and appointment tracking with intelligent notification sync.",
        icon: <Zap className="text-indigo-600" />,
        link: "/patient/reminders"
    }
];

export default function LandingPage() {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        checkSession();
        return () => window.removeEventListener('scroll', handleScroll);
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
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-100/30 overflow-x-hidden">
            {/* Clinical Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[50%] h-screen bg-gradient-to-l from-teal-50/30 to-transparent" />
                <div className="absolute bottom-0 left-0 w-[30%] h-[50%] bg-plum-50/20 rounded-full blur-[120px]" />
            </div>

            {/* Premium Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-4 md:px-12 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3 shadow-sm' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform">
                            <HeartPulse className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Health<span className="text-teal-600">on</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        {['Services', 'Security', 'Clinical Logic'].map(item => (
                            <a key={item} href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-colors">{item}</a>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/login')} className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-6 py-2.5 hover:bg-slate-50 rounded-xl transition-all">Sign In</button>
                        <button onClick={() => router.push('/login')} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-teal-700 active:scale-95 transition-all">Get Started</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-44 pb-32 px-6 z-10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full mb-8 border border-teal-100">
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">AI-Powered Precision Care</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-8">
                            Clinical Care. <br />
                            <span className="text-teal-600 underline decoration-teal-100 underline-offset-8">Reimagined.</span>
                        </h1>

                        <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12 max-w-xl">
                            Experience the next generation of healthcare. We integrate verified clinical logic with advanced AI screening to provide a secure, seamless medical journey.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => router.push('/login')}
                                className="px-10 py-5 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-teal-600/30 hover:bg-teal-700 hover:-translate-y-1 transition-all flex items-center gap-3"
                            >
                                Start Free Assessment <ArrowRight size={16} />
                            </button>
                            <button
                                onClick={() => router.push('/login')}
                                className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-teal-200 transition-all"
                            >
                                Browse Specialists
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-8 border-white">
                            <img
                                src="/images/hero_medical.png"
                                alt="Modern Medical Interaction"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-teal-600 rounded-full blur-3xl opacity-20 -z-10" />
                        <div className="absolute -top-6 -left-6 w-32 h-32 bg-plum-600 rounded-full blur-3xl opacity-10 -z-10" />
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto text-center mb-24">
                    <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mb-4">Functional Suite</h3>
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Everything For Your Journey.</h2>
                </div>

                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
                    {FEATURES.map((f, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-teal-100 transition-all group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                                {f.icon}
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4">{f.title}</h4>
                            <p className="text-slate-500 font-medium leading-relaxed mb-10">{f.desc}</p>
                            <button
                                onClick={() => router.push(f.link)}
                                className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-teal-600 hover:gap-5 transition-all"
                            >
                                Explore Feature <ArrowRight size={14} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white pt-32 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-16 mb-24">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                                    <HeartPulse className="text-white w-6 h-6" />
                                </div>
                                <span className="text-xl font-black tracking-tighter uppercase">Health<span className="text-teal-400">on</span></span>
                            </div>
                            <p className="text-slate-400 font-medium max-w-sm leading-relaxed">
                                Bridging the gap between clinical expertise and accessible technology through high-fidelity digital experiences.
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-white mb-8">Ecosystem</p>
                            <ul className="space-y-4">
                                {['AI Assessment', 'Telemedicine Room', 'Lab Reports', 'Vitals Insights'].map(item => (
                                    <li key={item} className="text-sm font-bold text-slate-400 hover:text-teal-400 transition-colors cursor-pointer">{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-white mb-8">Patient Care</p>
                            <ul className="space-y-4">
                                {['Medication Reminders', '7-Day Action Plan', 'Doctor Booking', 'Lifestyle Tracking'].map(item => (
                                    <li key={item} className="text-sm font-bold text-slate-400 hover:text-teal-400 transition-colors cursor-pointer">{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="pt-12 border-t border-slate-800 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            © 2025 Healthon Systems Limited. Professional Healthcare Solutions.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
