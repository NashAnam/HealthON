'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ArrowRight, Heart, Shield, Users, Activity,
    Video, FileText, Lock, CheckCircle2, Globe, Zap, Mail, Phone,
    Play, Menu, X, FlaskConical
} from 'lucide-react';
import { useState, useEffect } from 'react';

const SERVICES = [
    {
        title: "Online OPD",
        desc: "High-definition video encounters with certified specialists available 24/7.",
        icon: <Video className="text-[#5D2A42]" />,
    },
    {
        title: "Health Vault",
        desc: "Secure, AES-256 encrypted storage for your complete medical history.",
        icon: <Lock className="text-[#648C81]" />,
    },
    {
        title: "Vitals Monitor",
        desc: "Continuous health tracking integrated directly from your wearable devices.",
        icon: <Activity className="text-[#5D2A42]" />,
    },
    {
        title: "Smart Labs",
        desc: "Seamless lab bookings with digital report delivery to your profile.",
        icon: <FlaskConical className="text-[#648C81]" />,
    },
    {
        title: "Care Network",
        desc: "Connect with support groups and health advocates in a secure social space.",
        icon: <Users className="text-[#5D2A42]" />,
    },
    {
        title: "Cloud Pharmacy",
        desc: "AI-driven analysis and prescription delivery for proactive medical journeys.",
        icon: <Zap className="text-[#648C81]" />,
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
            const { data: { session } } = await import('@/lib/supabase').then(mod => mod.supabase.auth.getSession());
            if (session?.user) {
                const { supabase } = await import('@/lib/supabase');
                const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', session.user.id).maybeSingle();
                if (doctor) return router.push('/doctor/dashboard');
                const { data: patient } = await supabase.from('patients').select('id').eq('user_id', session.user.id).maybeSingle();
                if (patient) return router.push('/patient/dashboard');
            }
        } catch (error) {
            console.error('Auto-login check failed', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#5D2A42]/10 overflow-x-hidden">
            {/* Professional Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
                <div className="absolute top-0 right-0 w-1/2 h-screen bg-gradient-to-l from-[#648C81]/5 to-transparent" />
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4 md:px-12 ${isScrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm py-3' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#5D2A42] flex items-center justify-center">
                            <img src="/logo.png" alt="" className="w-5 h-5 object-contain brightness-0 invert" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">Health<span className="text-[#648C81]">on</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        {['Services', 'Network', 'About', 'Security'].map(m => (
                            <a key={m} href="#" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#5D2A42] transition-colors">{m}</a>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/login')} className="text-[11px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-slate-100/50">Log In</button>
                        <button onClick={() => router.push('/login')} className="px-6 py-2.5 bg-[#5D2A42] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-[#5D2A42]/15 active:scale-95 transition-all">Get Started</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-44 pb-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.05] tracking-tight mb-12">
                            Professional Care <br />
                            <span className="text-[#5D2A42]">Beyond Boundaries.</span>
                        </h1>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => router.push('/login')} className="px-10 py-4 bg-[#5D2A42] text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-[#5D2A42]/20 hover:bg-[#431e30] transition-all">
                                Get Started Now
                            </button>
                        </div>
                    </motion.div>

                    <div className="relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative z-10"
                        >
                            <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-slate-300/40 border border-slate-200">
                                <img
                                    src="/images/hero.png"
                                    alt="Medical Professional Interaction"
                                    className="w-full h-auto rounded-[2.25rem] object-cover"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Our Services Section */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto text-center mb-24">
                    <h3 className="text-[11px] font-bold text-[#648C81] uppercase tracking-[0.4em] mb-4">Our Services</h3>
                    <h2 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight">Everything You Need.</h2>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {SERVICES.map((s, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -6 }}
                            className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-8">
                                {s.icon}
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-4">{s.title}</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-10">{s.desc}</p>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[#5D2A42] flex items-center gap-2 group cursor-pointer hover:gap-4 transition-all">
                                System Details <ArrowRight size={14} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Professional Footer */}
            <footer className="bg-white border-t border-slate-200 pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                        <div className="col-span-1">
                            <div className="flex items-center gap-2.5 mb-8">
                                <div className="w-8 h-8 rounded-lg bg-[#5D2A42] flex items-center justify-center">
                                    <img src="/logo.png" alt="" className="w-5 h-5 object-contain brightness-0 invert" />
                                </div>
                                <span className="text-lg font-bold tracking-tight text-slate-900 uppercase">Health<span className="text-[#648C81]">on</span></span>
                            </div>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">Implementing high-fidelity digital healthcare experiences through ethical design and clinical precision.</p>
                            <div className="flex gap-3">
                                {[Globe, Mail, Phone].map((Icon, i) => (
                                    <button key={i} className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#5D2A42] hover:bg-white transition-all"><Icon size={18} /></button>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-12">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-8">Capabilities</p>
                                <ul className="space-y-4">{['Telemedicine', 'OPD Bridge', 'Smart Labs', 'Cloud Pharmacy'].map(i => <li key={i} className="text-sm font-medium text-slate-500 hover:text-[#5D2A42] transition-colors cursor-pointer">{i}</li>)}</ul>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-8">Trust Center</p>
                                <ul className="space-y-4">{['Privacy Charter', 'Clinician Docs', 'Encryption Tech', 'Compliance'].map(i => <li key={i} className="text-sm font-medium text-slate-500 hover:text-[#5D2A42] transition-colors cursor-pointer">{i}</li>)}</ul>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-8">Support</p>
                                <ul className="space-y-4">{['Clinical Help', 'Technical Ops', 'API Docs', 'Partner Login'].map(i => <li key={i} className="text-sm font-medium text-slate-500 hover:text-[#5D2A42] transition-colors cursor-pointer">{i}</li>)}</ul>
                            </div>
                        </div>
                    </div>
                    <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2025 Healthon Systems Limited. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
