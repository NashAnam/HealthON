'use client';
import { useRouter } from 'next/navigation';
import { Heart, Shield, Users, Zap, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-indigo-100 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                About CareOn
                            </h1>
                            <p className="text-sm text-gray-600">Your Complete Healthcare Platform</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-12 max-w-6xl">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-lg">
                        <Heart className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-5xl font-bold text-gray-900 mb-4">
                        Welcome to <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">CareOn</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        A comprehensive healthcare platform connecting patients, doctors, and labs seamlessly.
                    </p>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-4 gap-6 mb-16">
                    <FeatureCard
                        icon={<Users className="w-8 h-8" />}
                        title="For Everyone"
                        description="Patients, doctors, and labs all in one platform"
                        color="from-blue-500 to-indigo-600"
                    />
                    <FeatureCard
                        icon={<Shield className="w-8 h-8" />}
                        title="Secure & Private"
                        description="Your health data is encrypted and protected"
                        color="from-purple-500 to-pink-600"
                    />
                    <FeatureCard
                        icon={<Zap className="w-8 h-8" />}
                        title="Fast & Easy"
                        description="Book appointments and tests in seconds"
                        color="from-emerald-500 to-teal-600"
                    />
                    <FeatureCard
                        icon={<Heart className="w-8 h-8" />}
                        title="Health Tracking"
                        description="Monitor vitals and get health insights"
                        color="from-rose-500 to-red-600"
                    />
                </div>

                {/* What We Offer */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-16 border border-gray-100">
                    <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">What We Offer</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        <ServiceCard
                            title="For Patients"
                            features={[
                                "Book doctor appointments",
                                "Schedule lab tests",
                                "Track health vitals",
                                "Set medication reminders",
                                "Health risk assessments",
                                "View medical reports"
                            ]}
                        />
                        <ServiceCard
                            title="For Doctors"
                            features={[
                                "Manage appointments",
                                "OPD management",
                                "Patient records",
                                "Telemedicine support",
                                "Schedule management",
                                "Digital consultations"
                            ]}
                        />
                        <ServiceCard
                            title="For Labs"
                            features={[
                                "Manage test bookings",
                                "Upload reports",
                                "Track samples",
                                "Patient communication",
                                "Inventory management",
                                "Digital reports"
                            ]}
                        />
                    </div>
                </div>

                {/* Developer */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-12 text-white text-center">
                    <h3 className="text-2xl font-bold mb-6">Developed By</h3>
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mb-4 mx-auto border-4 border-white/30">
                        NA
                    </div>
                    <h4 className="text-xl font-bold">Nashrah Anam</h4>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description, color }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    );
}

function ServiceCard({ title, features }) {
    return (
        <div className="space-y-4">
            <h4 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-200">{title}</h4>
            <ul className="space-y-3">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-sm">{feature}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
