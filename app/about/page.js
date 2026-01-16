'use client';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Nav */}
            <nav className="p-6 flex items-center justify-between">
                <div onClick={() => router.back()} className="cursor-pointer flex items-center gap-2">
                    <ArrowLeft className="text-slate-400" />
                    <span className="font-black text-slate-900 uppercase tracking-tighter">Health<span className="text-[#648C81]">ON</span></span>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <div className="space-y-12">
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h1 className="text-4xl md:text-6xl font-black text-[#5D2A42] leading-tight mb-8">
                            Most chronic diseases <br />
                            <span className="text-rose-500">don’t start with pain.</span>
                        </h1>
                        <p className="text-xl md:text-2xl font-medium text-slate-600 leading-relaxed max-w-3xl">
                            They start quietly — in daily habits, small body changes, missed medicines, and numbers no one is tracking together.
                        </p>
                    </section>

                    <section className="space-y-6 text-lg md:text-xl text-slate-700 leading-relaxed max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                        <p className="font-bold text-[#648C81]">HealthON exists so you don’t have to guess.</p>

                        <p>
                            HealthON brings your daily body readings, prescriptions, medicines, diet, lab reports, and activity into one place and connects the dots over time. Instead of scattered reports and forgotten reminders, you see what’s actually happening to your health — early, continuously, and clearly.
                        </p>

                        <div className="p-8 bg-[#5D2A42]/5 border-l-4 border-[#5D2A42] rounded-r-2xl my-8">
                            <p className="italic font-medium text-[#5D2A42]">
                                "If something starts changing — before it turns into high BP, uncontrolled sugar, heart trouble, or kidney damage — HealthON helps flag it early, so you can act in time and speak to the right doctor with real data, not assumptions."
                            </p>
                        </div>

                        <p>
                            No more feeling “fine” on pills while problems silently build up.
                            <br />
                            No more reacting only after complications.
                        </p>

                        <p>
                            HealthON doesn’t diagnose or replace doctors. It helps you stay aware between doctor visits, shows whether treatments are helping, and supports better decisions — for you, your family, and your long-term health.
                        </p>

                        <p className="font-bold">
                            Built for India’s growing burden of chronic lifestyle diseases, HealthON focuses on prevention, continuity, and early action, not one-day checkups or disconnected care.
                        </p>
                    </section>

                    <div className="pt-8">
                        <button
                            onClick={() => router.push('/login')}
                            className="bg-[#5D2A42] text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-[#5D2A42]/20 hover:bg-[#4a2135] transition-all flex items-center gap-3"
                        >
                            Start Your Journey <ChevronRight />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
