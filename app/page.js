'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, ArrowRight, Activity, Calendar, FileText,
    Shield, CheckCircle2, Phone, Mail, MapPin, Star, UserPlus, Apple, Stethoscope
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
        { title: 'Health Tracker', desc: 'Log vitals, diet & metrics', color: 'bg-purple-100', icon: Calendar, image: '/screens/health-tracker.png' },
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
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900 flex flex-col">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                        {/* HealthON Logo */}
                        <Image src="/logo.png" alt="HealthON" width={40} height={40} className="rounded-xl" />
                        <span className="text-2xl font-black tracking-tight text-[#1a1a2e]">HealthON</span>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 flex-grow">
                <div className="max-w-7xl mx-auto px-6">

                    {/* Hero Grid - Enhanced Colors */}
                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        {/* Left Content */}
                        <div className="lg:col-span-5 text-left space-y-8">
                            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full w-fit border border-purple-100">
                                <img src="/logo.png" alt="HealthON" className="w-5 h-5 rounded-md" />
                                <span className="text-xs font-bold text-[#602E5A] tracking-wider uppercase">HealthON</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black text-[#1a1a2e] leading-[0.9] tracking-tight">
                                Your Health.<br />
                                <span className="text-[#602E5A]">Simplified.</span>
                            </h1>

                            <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-md">
                                Experience comprehensive healthcare management. Track vitals, consult doctors, and manage records—all in one secure platform.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => router.push('/patient/dashboard')}
                                    className="px-8 py-4 bg-[#602E5A] text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-900/20 hover:bg-[#4a2135] transition-all hover:-translate-y-1 flex items-center gap-3 group"
                                >
                                    <img src="/logo.png" alt="HealthON" className="w-5 h-5 rounded-md group-hover:scale-110 transition-transform" />
                                    TRACK YOUR HEALTH
                                </button>
                            </div>
                        </div>

                        {/* Right Content - App Slideshow (Use Case Screenshots) */}
                        <div className="lg:col-span-7 relative">
                            {/* Enhanced Background Decoration */}
                            <div className="absolute -inset-10 bg-gradient-to-tr from-purple-200 via-pink-100 to-teal-100 rounded-[3rem] blur-3xl opacity-60 -z-10 animate-pulse"></div>

                            <div className="relative w-full max-w-[260px] md:max-w-[300px] mx-auto aspect-[9/19.5] rounded-[2.5rem] bg-[#0f172a] p-3 shadow-2xl ring-1 ring-white/10">
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#1e293b] rounded-b-xl z-20"></div>
                                <div className="relative h-full w-full bg-[#020617] rounded-[2rem] overflow-hidden border border-white/5">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentAppSlide}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className={`absolute inset-0 ${appSlides[currentAppSlide].color} flex flex-col items-center justify-center`}
                                        >
                                            <div className="w-full h-full">
                                                <Image
                                                    src={appSlides[currentAppSlide].image}
                                                    alt={appSlides[currentAppSlide].title}
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                />
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Join Team CTA - Moved here */}


                {/* Medical Experts Section */}
                {experts.length > 0 && (
                    <div className="mt-20 overflow-hidden relative group">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-[#1a1a2e] mb-4">Meet Our Medical Experts</h2>
                            <p className="text-slate-500 font-medium">Top-rated specialists available for consultation</p>
                        </div>

                        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
                        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#602E5A]"></div>
                            </div>
                        ) : (
                            <motion.div
                                className="flex gap-6 w-max"
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{ repeat: Infinity, duration: experts.length * 3, ease: "linear" }}
                            >
                                {[...experts, ...experts].map((expert, i) => (
                                    <div key={i} className="w-64 bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex-shrink-0 hover:-translate-y-1 transition-transform">
                                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-sm flex items-center justify-center">
                                            {expert.type === 'Doctor' && <Stethoscope className="w-8 h-8 text-[#602E5A]" />}
                                            {expert.type === 'Nutritionist' && <Apple className="w-8 h-8 text-green-600" />}
                                            {expert.type === 'Physiotherapist' && <Activity className="w-8 h-8 text-orange-600" />}
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-center">{expert.name}</h3>
                                        <p className="text-xs font-bold text-[#602E5A] text-center uppercase tracking-wider mb-2">{expert.specialty}</p>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Join Team CTA */}
                <div className="text-center mt-20 mb-20">
                    <button
                        onClick={() => router.push('/complete-profile')}
                        className="px-10 py-5 bg-[#649488] text-white rounded-full font-black text-lg hover:bg-[#527a70] transition-all shadow-xl shadow-teal-900/20 hover:-translate-y-1 flex items-center gap-3 mx-auto"
                    >
                        <UserPlus className="w-6 h-6" />
                        Join Our Team of Medical Experts
                    </button>
                </div>
            </main>

            {/* Footer - Responsive with sections */}
            <footer className="bg-[#0f172a] py-12 md:py-16 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Main Footer Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
                        {/* About Section */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-black mb-4 uppercase tracking-tight">About HealthON</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                    Your comprehensive healthcare management platform. Track vitals, consult doctors, and manage records—all in one secure place.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => router.push('/about')}
                                        className="text-purple-400 hover:text-purple-300 font-bold text-sm transition-colors"
                                    >
                                        About Us →
                                    </button>
                                    <button
                                        onClick={() => router.push('/blogs')}
                                        className="text-purple-400 hover:text-purple-300 font-bold text-sm transition-colors"
                                    >
                                        Read Blogs →
                                    </button>
                                    <button
                                        onClick={() => router.push('/terms')}
                                        className="text-purple-400 hover:text-purple-300 font-bold text-sm transition-colors"
                                    >
                                        Terms & Conditions →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Contact Us Section */}
                        <div id="contact">
                            <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Contact Us</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-400 text-sm">
                                        <span className="font-bold text-white block mb-1">Email:</span>
                                        <a
                                            href="https://mail.google.com/mail/?view=cm&fs=1&to=contact@healthon.app"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-400 hover:text-purple-300 transition-colors break-all block"
                                        >
                                            contact@healthon.app
                                        </a>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">
                                        <span className="font-bold text-white block mb-2">Instagram:</span>
                                        <a
                                            href="https://instagram.com/healthon.app_"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                            </svg>
                                            @healthon.app_
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Our Team Section */}
                    <div id="team" className="mb-8">
                        <h3 className="text-2xl font-black mb-6 uppercase tracking-tight text-center">Our Team</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Shaista Javeed - CMO */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/10 transition-all">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-400 shadow-lg">
                                    <Image src="/doctors/dr-shaista.png" alt="Shaista Javeed" width={96} height={96} className="w-full h-full object-cover" />
                                </div>
                                <h4 className="font-black text-white text-lg mb-1">Shaista Javeed</h4>
                                <p className="text-purple-400 font-bold text-sm mb-1">Chief Medical Officer</p>
                                <p className="text-gray-400 text-xs">CMO</p>
                            </div>

                            {/* Nashrah Anam - CTO */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/10 transition-all">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-400 shadow-lg">
                                    <Image src="/team/nashrah.png" alt="Nashrah Anam" width={96} height={96} className="w-full h-full object-cover" />
                                </div>
                                <h4 className="font-black text-white text-lg mb-1">Nashrah Anam</h4>
                                <p className="text-purple-400 font-bold text-sm mb-1">Chief Technology Officer</p>
                                <p className="text-gray-400 text-xs">CTO</p>
                            </div>

                            {/* Afshan Unnisa - CFO */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/10 transition-all">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-400 shadow-lg">
                                    <Image src="/team/afshan.png" alt="Afshan Unnisa" width={96} height={96} className="w-full h-full object-cover" />
                                </div>
                                <h4 className="font-black text-white text-lg mb-1">Afshan Unnisa</h4>
                                <p className="text-purple-400 font-bold text-sm mb-1">Chief Financial Officer</p>
                                <p className="text-gray-400 text-xs">CFO</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Bottom - Copyright Only */}
                    <div className="border-t border-gray-700 pt-8">
                        <p className="text-gray-400 text-xs md:text-sm text-center">© 2026 HealthON. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}