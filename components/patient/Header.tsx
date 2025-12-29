'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Bell, User, FileText, Calendar, Activity, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ userName, userImage }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuItems = [
        { name: 'Network', icon: Users, href: '/patient/network' },
        { name: 'Pending Appointments', icon: Calendar, href: '/patient/appointments' },
        { name: 'My Prescriptions', icon: FileText, href: '/patient/prescriptions' },
        { name: 'My Reports', icon: Activity, href: '/patient/reports' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">

                {/* Logo */}
                <Link href="/patient/dashboard" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-plum-800 to-plum-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-plum-500/30 transition-shadow">
                        <span className="text-white font-bold text-xl">H</span>
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-plum-900 to-teal-700">
                        HealthON
                    </span>
                </Link>

                {/* Right Section */}
                <div className="flex items-center gap-6">
                    <button className="relative p-2 text-gray-400 hover:text-plum-600 transition-colors">
                        <Bell size={24} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900">{userName || 'Patient'}</p>
                            <p className="text-xs text-gray-500">Premium Member</p>
                        </div>

                        <div className="relative">
                            <div className="w-12 h-12 rounded-full ring-2 ring-plum-100 p-0.5 cursor-pointer">
                                {/* Placeholder for user image if not provided */}
                                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {userImage ? (
                                        <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} className="text-gray-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Ellipse Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-full hover:bg-gray-100/80 transition-colors text-gray-600"
                            >
                                <MoreHorizontal size={24} />
                            </button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2"
                                    >
                                        {menuItems.map((item, index) => (
                                            <Link
                                                key={index}
                                                href={item.href}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-plum-50 text-gray-700 hover:text-plum-700 transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <item.icon size={18} />
                                                <span className="font-medium text-sm">{item.name}</span>
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
