"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { ArrowRight, Activity, ShieldCheck, HeartPulse, Stethoscope, CheckCircle2, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function HomePage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, email, message } = formData;

    if (!firstName || !email || !message) {
      toast.error("Please fill in all required fields");
      return;
    }

    const subject = `New Inquiry from ${firstName} ${lastName}`;
    const body = `Name: ${firstName} ${lastName}\nEmail: ${email}\n\nMessage:\n${message}`;

    // Open email client
    window.location.href = `mailto:contact@healthon.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success("Opening your email client...");

    // Reset form
    setFormData({ firstName: "", lastName: "", email: "", message: "" });
  };

  return (
    <main className="min-h-screen w-full bg-white font-sans text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      {/* Navbar */}
      <nav className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">HealthOn</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">Home</Link>
            <Link href="/about" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">About Us</Link>
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#contact" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 -z-10"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-30 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100 rounded-full blur-3xl opacity-30 -ml-20 -mb-20"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-indigo-100 rounded-full mb-8 shadow-sm animate-fade-in-up">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700">Welcome to HealthOn</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
            Your Health Journey, <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Simplified & Secure
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto font-medium leading-relaxed">
            Know Early, Act Right, Save Life
          </p>
          <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with verified doctors, book lab tests, track your health metrics, and manage your entire family's healthcare in one secure platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl bg-indigo-600 text-white text-lg font-bold hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30 transition-all transform hover:-translate-y-1 flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-lg font-bold hover:border-indigo-300 hover:shadow-lg transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose HealthOn?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Everything you need to manage your health, all in one place.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Patient Card */}
            <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group hover:-translate-y-2 duration-300">
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
            <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-100/50 transition-all group hover:-translate-y-2 duration-300">
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
            <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all group hover:-translate-y-2 duration-300">
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

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-bold text-sm mb-6">
                <Mail className="w-4 h-4" />
                <span>Get in Touch</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">We're here to help you.</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Have questions about HealthOn? Our team is ready to assist you. Reach out to us for support.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Email Us</p>
                    <p className="text-lg font-bold text-slate-900">contact@healthon.app</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all min-h-[120px]"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5">
                  Send Message
                </button>
              </form>
              {/* Hero Section */}
              <section className="relative py-20 md:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 -z-10"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-30 -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100 rounded-full blur-3xl opacity-30 -ml-20 -mb-20"></div>

                <div className="max-w-7xl mx-auto px-6 md:px-12 text-center relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-indigo-100 rounded-full mb-8 shadow-sm animate-fade-in-up">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-indigo-700">Welcome to HealthOn</span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                    Your Health Journey, <br className="hidden md:block" />
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      Simplified & Secure
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto font-medium leading-relaxed">
                    Know Early, Act Right, Save Life
                  </p>
                  <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Connect with verified doctors, book lab tests, track your health metrics, and manage your entire family's healthcare in one secure platform.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                      href="/login"
                      className="px-8 py-4 rounded-2xl bg-indigo-600 text-white text-lg font-bold hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30 transition-all transform hover:-translate-y-1 flex items-center gap-2"
                    >
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href="/about"
                      className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-lg font-bold hover:border-indigo-300 hover:shadow-lg transition-all"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </section>

              {/* Features Grid */}
              <section id="features" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                  <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose HealthOn?</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg">Everything you need to manage your health, all in one place.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Patient Card */}
                    <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group hover:-translate-y-2 duration-300">
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
                    <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-100/50 transition-all group hover:-translate-y-2 duration-300">
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
                    <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all group hover:-translate-y-2 duration-300">
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

              {/* Contact Section */}
              <section id="contact" className="py-24 bg-slate-50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                  <div className="grid md:grid-cols-2 gap-16 items-start">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-bold text-sm mb-6">
                        <Mail className="w-4 h-4" />
                        <span>Get in Touch</span>
                      </div>
                      <h2 className="text-4xl font-bold text-slate-900 mb-6">We're here to help you.</h2>
                      <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                        Have questions about HealthOn? Our team is ready to assist you. Reach out to us for support.
                      </p>

                      <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Mail className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Email Us</p>
                            <p className="text-lg font-bold text-slate-900">contact@healthon.app</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100">
                      <h3 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h3>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                              placeholder="John"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Message</label>
                          <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all min-h-[120px]"
                            placeholder="How can we help you?"
                          ></textarea>
                        </div>
                        <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5">
                          Send Message
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <footer className="bg-slate-900 text-white pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold">HealthOn</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed mb-6">
                        Empowering you to take control of your health with advanced technology and compassionate care.
                      </p>
                      <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                          <Facebook className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                          <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                          <Instagram className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold mb-6">Quick Links</h4>
                      <ul className="space-y-4">
                        <li><Link href="/" className="text-slate-400 hover:text-indigo-400 transition-colors">Home</Link></li>
                        <li><Link href="/about" className="text-slate-400 hover:text-indigo-400 transition-colors">About Us</Link></li>
                        <li><a href="#features" className="text-slate-400 hover:text-indigo-400 transition-colors">Features</a></li>
                        <li><a href="#contact" className="text-slate-400 hover:text-indigo-400 transition-colors">Contact</a></li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold mb-6">Services</h4>
                      <ul className="space-y-4">
                        <li><Link href="/login" className="text-slate-400 hover:text-indigo-400 transition-colors">Find a Doctor</Link></li>
                        <li><Link href="/login" className="text-slate-400 hover:text-indigo-400 transition-colors">Lab Tests</Link></li>
                        <li><Link href="/login" className="text-slate-400 hover:text-indigo-400 transition-colors">Health Tracking</Link></li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500">© 2025 HealthOn. All rights reserved.</p>
                    <p className="text-slate-500 flex items-center gap-2">
                    </p>
                  </div>
                </div>
              </footer>
            </main>
            );
}