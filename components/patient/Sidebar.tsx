// ... (imports remain the same, will be injected below)
'use client';
import { Home, Users, Calendar, FileText, Activity, Pill, Bell, LogOut, MoreHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSidebar } from '@/lib/SidebarContext';
import toast from 'react-hot-toast';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isOpen, close } = useSidebar();

    const handleLogout = async () => {
        await supabase?.auth.signOut();
        toast.success('Logged out successfully');
        router.push('/login');
    };

    const menuItems = [
        { name: 'Home', icon: Home, href: '/patient/dashboard' },
        { name: 'Network', icon: Users, href: '/patient/network' },
        { name: 'Appointments', icon: Calendar, href: '/patient/appointments' },
        { name: 'My Reminders', icon: Bell, href: '/patient/reminders' },
        { name: 'My Prescriptions', icon: FileText, href: '/patient/prescriptions' },
        { name: 'My Reports', icon: Activity, href: '/patient/reports' },
    ];

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
                    onClick={close}
                />
            )}

            {/* Sidebar Content */}
            <aside className={`
                fixed top-0 right-0 h-screen w-72 bg-white flex flex-col border-l border-gray-100 z-[1000] transition-transform duration-300 ease-in-out shadow-2xl
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>

                {/* Logo Area */}
                <div className="p-6 mb-2 flex justify-between items-center">
                    <Link href="/patient/dashboard" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 flex items-center justify-center p-1">
                            <img src="/logo.png" alt="HealthON Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">
                            Health<span className="text-[#648C81]">ON</span>
                        </span>
                    </Link>
                    <button onClick={close} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={close}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-plum-50 text-plum-700 font-semibold shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? 'text-plum-700' : 'text-slate-400 group-hover:text-slate-600'} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Area */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-rose-600 hover:bg-rose-50 transition-all font-bold"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>

            </aside>
        </>
    );
}
