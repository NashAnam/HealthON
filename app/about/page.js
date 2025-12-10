'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Heart, Shield, Zap, Activity } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-indigo-100 shadow-sm">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Home</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 drop-shadow-md">
                            <Image
                                src="/images/careon-logo.png"
                                alt="HealthOn Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">HealthOn</span>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20 text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-semibold text-sm mb-6 animate-fade-in-up">
                    <Heart className="w-4 h-4 fill-indigo-700" />
                    <span>Your Health, Our Priority</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
                    Healthcare <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Simplified.</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
                    HealthOn connects you with doctors, labs, and your own health data in one simple, secure platform.
                    We believe managing your health should be effortless and beautiful.
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => router.push('/login')}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:-translate-y-1 transition-all"
                    >
                        Get Started Now
                    </button>
                </div>
            </section>

            {/* Core Value Cards */}
            <section className="container mx-auto px-6 py-16">
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={Zap}
                        color="amber"
                        title="Instant Access"
                        description="Book appointments and lab tests instantly. No waiting, no hassle."
                    />
                    <FeatureCard
                        icon={Shield}
                        color="emerald"
                        title="Secure & Private"
                        description="Your health data is encrypted and safe. You control who sees what."
                    />
                    <FeatureCard
                        icon={Activity}
                        color="rose"
                        title="Smart Insights"
                        description="Track vitals and get personalized health tips based on your data."
                    />
                </div>
            </section>

            {/* Mission Section */}
            <section className="bg-white py-20 border-y border-slate-100">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2rem] opacity-20 blur-xl"></div>
                            <div className="relative bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[2rem] border border-indigo-100 shadow-xl">
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
                                <p className="text-slate-600 text-lg leading-relaxed">
                                    To empower everyone with accessible, personalized, and proactive healthcare tools.
                                    From booking appointments to tracking vitals, we put your health in your hands.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <Benefit text="Instant Doctor Appointments" color="indigo" />
                            <Benefit text="Home Lab Sample Collection" color="violet" />
                            <Benefit text="Digital Health Records" color="emerald" />
                            <Benefit text="Smart Health Reminders" color="rose" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-8 mt-auto">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-slate-400 text-sm">
                        © 2025 HealthOn. Know Early, Act Right, Save Life.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, color, title, description }) {
    const colors = {
        amber: 'bg-amber-100 text-amber-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        rose: 'bg-rose-100 text-rose-600'
    };

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
            <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center mb-6`}>
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </div>
    );
}

function Benefit({ text, color }) {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50',
        violet: 'text-violet-600 bg-violet-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        rose: 'text-rose-600 bg-rose-50'
    };

    return (
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className={`p-2 rounded-full ${colors[color]}`}>
                <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-700 text-lg">{text}</span>
        </div>
    );
}
