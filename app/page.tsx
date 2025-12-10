"use client";

import Link from "next/link";
import { ArrowRight, Activity, ShieldCheck, HeartPulse, Stethoscope, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-white font-sans text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      {/* Navbar */}
      <nav className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">HealthOn</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/about" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              About
            </Link>
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 md:py-32 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-8">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700">Welcome to HealthOn</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Your Health Journey,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto font-semibold">
            Know Early, Act Right, Save Life
          </p>
          <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
            Connect with verified doctors, book lab tests, track your health metrics, and manage your entire family's healthcare in one secure platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-bold hover:shadow-2xl hover:shadow-indigo-600/30 transition-all transform hover:-translate-y-1 flex items-center gap-2">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 text-lg font-bold hover:border-indigo-300 hover:shadow-lg transition-all">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Patient Card */}
            <div className="p-10 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group hover:-translate-y-2 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-all text-indigo-600 group-hover:text-white">
                <HeartPulse className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">For Patients</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Manage your entire family's health. Book appointments, track medications, and access records securely.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Instant Booking
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Digital Records
                </li>
              </ul>
            </div>

            {/* Doctor Card */}
            <div className="p-10 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/50 transition-all group hover:-translate-y-2 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-8 group-hover:bg-violet-600 transition-all text-violet-600 group-hover:text-white">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">For Doctors</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Streamline your practice. Digital OPD, patient history, and analytics in one dashboard.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-violet-600" />
                  OPD Management
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-violet-600" />
                  Patient History
                </li>
              </ul>
            </div>

            {/* Lab Card */}
            <div className="p-10 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/50 transition-all group hover:-translate-y-2 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-all text-emerald-600 group-hover:text-white">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">For Labs</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Efficient test booking and reporting. Automate notifications and manage home collections.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Smart Scheduling
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Digital Reports
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">HealthOn</span>
          </div>
          <p className="text-slate-500 font-medium">© 2025 HealthOn Healthcare. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}