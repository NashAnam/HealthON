'use client';
import { useRouter } from 'next/navigation';
import { Heart, Shield, Users, Zap, ArrowLeft, CheckCircle2, Activity, Stethoscope, FlaskConical } from 'lucide-react';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-indigo-100 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Home</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">CareOn</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                        Your Health,{' '}
                        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                            Our Priority
                        </span>
                    </h1>
                    <p className="text-xl text-slate-600 leading-relaxed mb-8">
                        CareOn is a comprehensive healthcare management platform designed to make healthcare accessible,
                        efficient, and personalized for everyone.
                    </p>
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 rounded-full border border-indigo-200">
                        <Heart className="w-5 h-5 text-indigo-600" />
                        <span className="text-indigo-700 font-semibold">Empowering Better Health Outcomes</span>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="container mx-auto px-6 py-16">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                            <Heart className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            To revolutionize healthcare delivery by providing an integrated platform that connects patients,
                            doctors, and labs, making quality healthcare accessible to everyone, everywhere.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mb-6">
                            <Zap className="w-8 h-8 text-violet-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Vision</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            To become the leading healthcare platform that empowers individuals to take control of their health
                            through technology, data-driven insights, and seamless care coordination.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">What We Offer</h2>
                    <p className="text-xl text-slate-600">Comprehensive healthcare solutions at your fingertips</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={Stethoscope}
                        title="Doctor Consultations"
                        description="Connect with verified doctors for in-person or telemedicine consultations"
                        color="indigo"
                    />
                    <FeatureCard
                        icon={FlaskConical}
                        title="Lab Services"
                        description="Book lab tests with home collection and get digital reports instantly"
                        color="violet"
                    />
                    <FeatureCard
                        icon={Activity}
                        title="Health Tracking"
                        description="Monitor vitals, track health metrics, and get personalized insights"
                        color="emerald"
                    />
                    <FeatureCard
                        icon={Shield}
                        title="Risk Assessment"
                        description="AI-powered health risk assessments for diabetes, hypertension, and more"
                        color="rose"
                    />
                    <FeatureCard
                        icon={Users}
                        title="Patient Management"
                        description="Comprehensive health records and appointment management in one place"
                        color="blue"
                    />
                    <FeatureCard
                        icon={Heart}
                        title="Reminders & Alerts"
                        description="Never miss medications or appointments with smart notifications"
                        color="pink"
                    />
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="container mx-auto px-6 py-16">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-12 text-white">
                    <h2 className="text-4xl font-bold mb-8 text-center">Why Choose CareOn?</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <BenefitItem text="Verified healthcare professionals" />
                        <BenefitItem text="Secure and private health data" />
                        <BenefitItem text="24/7 access to your health records" />
                        <BenefitItem text="AI-powered health insights" />
                        <BenefitItem text="Seamless appointment booking" />
                        <BenefitItem text="Home lab collection services" />
                        <BenefitItem text="Telemedicine consultations" />
                        <BenefitItem text="Personalized health tracking" />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Take Control of Your Health?</h2>
                    <p className="text-xl text-slate-600 mb-8">
                        Join thousands of users who trust CareOn for their healthcare needs
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 transition-all"
                    >
                        Get Started Today
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold">CareOn</span>
                    </div>
                    <p className="text-slate-400 mb-2">Empowering Better Health Outcomes</p>
                    <p className="text-slate-500 text-sm">© 2025 CareOn. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description, color }) {
    const colors = {
        indigo: 'bg-indigo-100 text-indigo-600',
        violet: 'bg-violet-100 text-violet-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        rose: 'bg-rose-100 text-rose-600',
        blue: 'bg-blue-100 text-blue-600',
        pink: 'bg-pink-100 text-pink-600'
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all group">
            <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600">{description}</p>
        </div>
    );
}

function BenefitItem({ text }) {
    return (
        <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <span className="text-lg">{text}</span>
        </div>
    );
}
