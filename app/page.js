'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, ArrowRight, Activity, Calendar, FileText,
    Shield, CheckCircle2, Phone, Mail, MapPin, Star, UserPlus, Apple, Stethoscope, ChevronRight
} from 'lucide-react';
import { getVerifiedDoctors, getVerifiedNutritionists, getVerifiedPhysiotherapists } from '@/lib/supabase';
import Image from 'next/image';

export default function LandingPage() {
    const router = useRouter();
    const [currentAppSlide, setCurrentAppSlide] = useState(0);
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);

    const appSlides = [
        { title: 'Health Assessment', desc: 'Analyze primary risks', color: 'bg-purple-100', icon: Activity, image: '/screens/health-assessment.png' },
        { title: 'Health Tracker', desc: 'Log vitals, diet & metrics', color: 'bg-green-100', icon: Calendar, image: '/screens/health-tracker.png' },
        { title: 'Book Appointments', desc: 'Find and consult doctors', color: 'bg-blue-100', icon: FileText, image: '/screens/book-appointment.png' },
        { title: 'Weekly Progress', desc: 'View visual health trends', color: 'bg-pink-100', icon: Apple, image: '/screens/weekly-progress.png' }
    ];

    useEffect(() => {
        const appInterval = setInterval(() => setCurrentAppSlide(p => (p + 1) % appSlides.length), 3000);
        loadExperts();
        return () => clearInterval(appInterval);
    }, []);

    const loadExperts = async () => {
        try {
            const [doctorsRes, nutritionistsRes, physiotherapistsRes] = await Promise.all([
                getVerifiedDoctors(),
                getVerifiedNutritionists(),
                getVerifiedPhysiotherapists()
            ]);

            // Filter out admin team members if they appear in expert lists
            const adminNames = ['Nashrah Anam', 'Shaista Javeed', 'Afshan Unnisa'];

            const allExperts = [
                ...(doctorsRes.data || []).map(d => ({ ...d, type: 'Doctor', specialty: d.specialty || 'General Physician' })),
                ...(nutritionistsRes.data || []).map(n => ({ ...n, type: 'Nutritionist', specialty: 'Nutritionist' })),
                ...(physiotherapistsRes.data || []).map(p => ({ ...p, type: 'Physiotherapist', specialty: 'Physiotherapist' }))
            ].filter(e => !adminNames.includes(e.name));

            setExperts(allExperts);
        } catch (error) {
            console.error('Error loading experts:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF8FA] font-sans text-slate-900 selection:bg-[#4a2b3d] selection:text-white flex flex-col">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#4a2b3d]/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
                        {/* HealthON Logo */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4a2b3d] blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <Image src="/logo.png" alt="HealthON" width={40} height={40} className="rounded-xl relative z-10" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-[#1a1a2e] group-hover:text-[#4a2b3d] transition-colors">HealthON</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-2.5 bg-[#4a2b3d] text-white rounded-full font-bold text-sm shadow-lg shadow-[#4a2b3d]/20 hover:bg-[#4a2b3d] hover:shadow-xl hover:shadow-[#4a2b3d]/30 hover:-translate-y-0.5 transition-all"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 flex-grow">
                {/* Hero Section */}
                <div className="max-w-7xl mx-auto px-6 mb-32">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        {/* Left Content */}
                        <div className="lg:col-span-5 text-left space-y-8 relative z-10">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4a2b3d]/5 to-[#5a8a7a]/5 rounded-full border border-[#4a2b3d]/10"
                            >
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5a8a7a] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5a8a7a]"></span>
                                </span>
                                <span className="text-xs font-bold text-[#4a2b3d] tracking-wider uppercase">Future of Healthcare</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-7xl font-black text-[#1a1a2e] leading-[0.95] tracking-tight"
                            >
                                Your Health.<br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4a2b3d] to-[#5a8a7a]">Simplified.</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg text-slate-600 font-medium leading-relaxed max-w-md"
                            >
                                Experience comprehensive healthcare management. Track vitals, consult doctors, and manage records—all in one secure platform.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <button
                                    onClick={() => router.push('/patient/dashboard')}
                                    className="px-8 py-4 bg-gradient-to-r from-[#4a2b3d] to-[#4a2b3d] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#4a2b3d]/25 hover:shadow-2xl hover:shadow-[#4a2b3d]/40 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 group"
                                >
                                    <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    TRACK YOUR HEALTH
                                </button>
                            </motion.div>

                            <div className="flex items-center gap-8 pt-4">
                                <div>
                                    <p className="text-3xl font-black text-[#4a2b3d]">10k+</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Users</p>
                                </div>
                                <div className="w-px h-10 bg-[#4a2b3d]/10"></div>
                                <div>
                                    <p className="text-3xl font-black text-[#5a8a7a]">50+</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experts</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Content - App Slideshow (Use Case Screenshots) */}
                        <div className="lg:col-span-7 relative flex justify-end">
                            {/* Enhanced Background Decoration */}
                            <div className="absolute -inset-20 bg-gradient-to-tr from-[#4a2b3d]/20 via-[#5a8a7a]/20 to-pink-100 rounded-full blur-[100px] opacity-70 -z-10 animate-pulse-slow"></div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                className="relative w-full max-w-[320px] aspect-[9/18] rounded-[3rem] bg-[#1a1a2e] p-4 shadow-2xl ring-4 ring-[#4a2b3d]/10"
                            >
                                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#0f172a] rounded-b-2xl z-20"></div>
                                <div className="relative h-full w-full bg-white rounded-[2.5rem] overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentAppSlide}
                                            initial={{ opacity: 0, scale: 1.05 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.6 }}
                                            className={`absolute inset-0 ${appSlides[currentAppSlide].color} flex flex-col items-center justify-center`}
                                        >
                                            <div className="w-full h-full relative">
                                                {/* Fallback pattern if image fails */}
                                                <div className="absolute inset-0 opacity-10 bg-[url('/pattern.png')] bg-repeat"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Image
                                                        src={appSlides[currentAppSlide].image}
                                                        alt={appSlides[currentAppSlide].title}
                                                        fill
                                                        className="object-cover"
                                                        priority
                                                    />
                                                </div>
                                            </div>

                                            {/* Feature Badge Overlay */}
                                            <div className="absolute bottom-10 left-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/50">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <div className={`p-2 rounded-lg ${appSlides[currentAppSlide].color}`}>
                                                        {(() => {
                                                            const Icon = appSlides[currentAppSlide].icon;
                                                            return <Icon className="w-5 h-5 text-[#4a2b3d]" />;
                                                        })()}
                                                    </div>
                                                    <h3 className="font-bold text-[#1a1a2e]">{appSlides[currentAppSlide].title}</h3>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium ml-12">{appSlides[currentAppSlide].desc}</p>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Features Grid - Removed */}

                {/* Medical Experts Section */}
                <div id="experts" className="py-20 bg-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#FDF8FA]/50"></div>
                    {/* Decorative Blobs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#4a2b3d]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#5a8a7a]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        {experts.length > 0 && (
                            <div className="relative group">
                                <div className="text-center mb-12">
                                    <span className="text-xs font-black text-[#4a2b3d] uppercase tracking-widest">Our Network</span>
                                    <h2 className="text-4xl font-black text-[#1a1a2e] mt-2 mb-4">Meet Our Experts</h2>
                                    <p className="text-slate-500 font-medium">Top-rated specialists available for consultation</p>
                                </div>

                                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#FDF8FA] to-transparent z-10"></div>
                                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#FDF8FA] to-transparent z-10"></div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#4a2b3d]"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden py-4">
                                        <motion.div
                                            className="flex gap-8 w-max px-4"
                                            animate={{ x: ["0%", "-50%"] }}
                                            transition={{ repeat: Infinity, duration: Math.max(20, experts.length * 5), ease: "linear" }}
                                        >
                                            {[...experts, ...experts].map((expert, i) => (
                                                <div key={i} className="w-72 bg-white rounded-[2rem] p-6 shadow-xl shadow-[#4a2b3d]/5 border border-[#4a2b3d]/5 flex-shrink-0 hover:-translate-y-2 transition-transform duration-300 group/card">
                                                    <div className="w-24 h-24 bg-gradient-to-br from-[#4a2b3d]/5 to-[#5a8a7a]/10 rounded-full mx-auto mb-6 overflow-hidden border-4 border-white shadow-lg flex items-center justify-center group-hover/card:scale-105 transition-transform">
                                                        {expert.type === 'Doctor' && <Stethoscope className="w-10 h-10 text-[#4a2b3d]" />}
                                                        {expert.type === 'Nutritionist' && <Apple className="w-10 h-10 text-[#5a8a7a]" />}
                                                        {expert.type === 'Physiotherapist' && <Activity className="w-10 h-10 text-orange-500" />}
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 text-center text-lg">{expert.name}</h3>
                                                    <div className={`w-fit mx-auto mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${expert.type === 'Doctor' ? 'bg-[#4a2b3d]/10 text-[#4a2b3d]' :
                                                        expert.type === 'Nutritionist' ? 'bg-[#5a8a7a]/10 text-[#5a8a7a]' :
                                                            'bg-orange-50 text-orange-600'
                                                        }`}>
                                                        {expert.specialty}
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Join Team CTA moved here */}
                    <div className="mt-12 text-center pb-8 relative z-10">
                        <button
                            onClick={() => router.push('/complete-profile')}
                            className="px-10 py-5 bg-[#4a2b3d] text-white rounded-full font-black text-lg hover:bg-[#4a2b3d] transition-all shadow-xl hover:-translate-y-1 flex items-center gap-3 mx-auto"
                        >
                            <UserPlus className="w-6 h-6 text-white" />
                            Join Our Team of Medical Experts
                        </button>
                        <p className="text-slate-500 text-sm mt-4 font-medium">Are you a doctor, nutritionist or physiotherapist?</p>
                    </div>
                </div>

                {/* Team Section */}
                <div id="team" className="py-20 max-w-7xl mx-auto px-6">
                    <div className="bg-[#1a1a2e] rounded-[3rem] p-12 md:p-20 relative overflow-hidden text-center">
                        {/* Background Gradients */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4a2b3d]/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#5a8a7a]/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-white mb-12 uppercase tracking-wide">Development Team</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center max-w-4xl mx-auto">
                                {[
                                    { name: 'Shaista Javeed', role: 'CMO', title: 'Chief Medical Officer', img: '/doctors/dr-shaista.png' },
                                    { name: 'Nashrah Anam', role: 'CTO', title: 'Chief Technology Officer', img: '/team/nashrah.png' },
                                    { name: 'Afshan Unnisa', role: 'CFO', title: 'Chief Financial Officer', img: '/team/afshan.png' }
                                ].map((member, i) => (
                                    <div key={i} className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-2 group">
                                        <div className="w-28 h-28 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#4a2b3d] shadow-2xl relative">
                                            {member.img ? (
                                                <Image src={member.img} alt={member.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
                                                    <UserPlus className="w-10 h-10 text-white/50" />
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="font-black text-white text-xl mb-2">{member.name}</h4>
                                        <p className="text-[#5a8a7a] font-bold text-sm uppercase tracking-wider mb-1">{member.role}</p>
                                        <p className="text-white/40 text-xs">{member.title}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-20">
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#0f172a] py-12 border-t border-white/5 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#4a2b3d] rounded-xl flex items-center justify-center">
                                <span className="font-black text-lg">H</span>
                            </div>
                            <span className="text-2xl font-black tracking-tight">HealthON</span>
                        </div>
                        <div className="flex gap-8 text-sm font-bold text-gray-400">
                            <button onClick={() => router.push('/about')} className="hover:text-[#5a8a7a] transition-colors">About</button>
                            <button onClick={() => router.push('/blogs')} className="hover:text-[#5a8a7a] transition-colors">Blogs</button>
                            <a href="mailto:contact@healthon.app" className="hover:text-[#5a8a7a] transition-colors">Contact</a>
                            <button onClick={() => router.push('/terms')} className="hover:text-[#5a8a7a] transition-colors">Terms</button>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-xs">© 2026 HealthON. All rights reserved.</p>
                        <div className="flex gap-4">
                            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#4a2b3d] transition-colors">
                                <TwitterIcon className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#4a2b3d] transition-colors">
                                <InstagramIcon className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function TwitterIcon(props) {
    return (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
    )
}

function InstagramIcon(props) {
    return (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.451 2.535c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
        </svg>
    )
}