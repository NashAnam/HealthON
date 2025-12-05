'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8">
                            <Image
                                src="/images/careon-logo.png"
                                alt="CareOn Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-xl font-bold text-slate-900">CareOn</span>
                    </div>
                </div>
            </header>

            {/* Hero Section - Simplified */}
            <section className="container mx-auto px-6 py-16 text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                    Healthcare Simplified.
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed mb-8">
                    CareOn connects you with doctors, labs, and your own health data in one simple, secure platform.
                    We believe managing your health should be effortless.
                </p>
            </section>

            {/* Core Value - Concise */}
            <section className="bg-slate-50 py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
                            <p className="text-slate-600 text-lg leading-relaxed">
                                To empower everyone with accessible, personalized, and proactive healthcare tools.
                                From booking appointments to tracking vitals, we put your health in your hands.
                            </p>
                        </div>
                        <div className="grid gap-4">
                            <Benefit text="Instant Doctor Appointments" />
                            <Benefit text="Home Lab Sample Collection" />
                            <Benefit text="Digital Health Records" />
                            <Benefit text="Smart Health Reminders" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA - Minimal */}
            <section className="container mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">Start Your Journey</h2>
                <button
                    onClick={() => router.push('/login')}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                    Get Started
                </button>
            </section>

            {/* Footer - Clean */}
            <footer className="bg-white border-t border-slate-100 py-8">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="relative w-6 h-6">
                            <Image
                                src="/images/careon-logo.png"
                                alt="CareOn Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-lg font-bold text-slate-900">CareOn</span>
                    </div>
                    <p className="text-slate-500 text-sm">© 2025 CareOn. Know Early, Act Right, Save Life.</p>
                </div>
            </footer>
        </div>
    );
}

function Benefit({ text }) {
    return (
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span className="font-medium text-slate-700">{text}</span>
        </div>
    );
}
