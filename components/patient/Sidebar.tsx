'use client';
import { Home, User, FileText, Calendar, Activity, Pill, LogOut, X, AlertCircle, Stethoscope, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
        { name: 'Appointments', icon: Calendar, href: '/patient/appointments' },
        { name: 'Prescriptions', icon: Pill, href: '/patient/prescriptions' },
        { name: 'Reminders', icon: Bell, href: '/patient/reminders' },
        { name: 'Reports', icon: FileText, href: '/patient/reports' },
        { name: 'Profile', icon: User, href: '/patient/profile' },
    ];

    return (
        <>
            {/* Overlay (Mobile Only) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] lg:hidden"
                    onClick={close}
                />
            )}

            {/* Sidebar Content - FIGMA DESIGN */}
            <aside className={`
                fixed top-0 left-0 h-screen w-[200px] bg-[#4a2b3d] flex flex-col z-[1000] transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>

                {/* Logo Area */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <Link href="/patient/dashboard" className="flex items-center gap-3 group">
                        <motion.div
                            animate={{ scale: [1, 1.03, 1] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-32 h-16 flex items-center justify-center bg-white rounded-xl shadow-lg shadow-black/20 overflow-hidden"
                        >
                            <img src="/logo.png" alt="HealthON Logo" className="w-full h-full object-contain p-2" />
                        </motion.div>
                    </Link>
                    <button onClick={close} className="p-2 text-white/70 hover:bg-white/10 rounded-full lg:hidden">
                        <X size={20} />
                    </button>
                </div>



                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={close}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-[#5a8a7a] text-white font-semibold'
                                    : 'text-white/90 hover:bg-white/10'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span className="text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Area */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 px-4 py-2 w-full rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white text-sm font-medium"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>

            </aside>
        </>
    );
}
