'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Bell, User, FileText, Calendar, Activity, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
    userName?: string;
    userImage?: string;
}

export default function Header({ userName, userImage }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuItems = [
        { name: 'Network', icon: Users, href: '/patient/network' },
        { name: 'Pending Appointments', icon: Calendar, href: '/patient/appointments' },
        { name: 'My Prescriptions', icon: FileText, href: '/patient/prescriptions' },
        { name: 'My Reports', icon: Activity, href: '/patient/reports' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300 lg:pl-64">
            <div className="max-w-7xl mx-auto flex items-center justify-between">

                {/* Mobile Menu Trigger & Logo (Mobile Only) */}
                <div className="flex items-center gap-3 lg:hidden">
                    <Link href="/patient/dashboard" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center p-2 shadow-lg shadow-indigo-200/50 transition-transform group-hover:scale-110">
                            <Activity className="w-full h-full text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Health<span className="text-indigo-600">on</span></span>
                    </Link>
                </div>

                {/* Center / Search Area */}
                <div className="flex-1 max-w-md hidden md:block">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Activity size={18} className="text-gray-400 group-hover:text-plum-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search doctors, labs..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-plum-500 focus:border-plum-500 sm:text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    <button className="relative p-2 text-gray-400 hover:text-plum-600 transition-colors">
                        <Bell size={24} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900">{userName || 'Patient'}</p>
                            <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full inline-block">Online</p>
                        </div>

                        <div className="relative group">
                            <div className="w-10 h-10 rounded-full bg-plum-100 ring-2 ring-white shadow-sm flex items-center justify-center text-plum-700 font-bold cursor-pointer">
                                {userImage ? (
                                    <img src={userImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    userName?.[0] || 'U'
                                )}
                            </div>

                            {/* Simple Dropdown for Logout */}
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 hidden group-hover:block animate-fade-in">
                                <div className="px-4 py-2 border-b border-gray-50">
                                    <p className="text-sm font-bold text-gray-900">My Account</p>
                                    <p className="text-xs text-gray-500">Manage profile</p>
                                </div>
                                <Link href="/login" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">
                                    Sign Out
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
