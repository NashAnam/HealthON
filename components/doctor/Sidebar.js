'use client';
import { Home, Users, Calendar, FileText, Activity, Video, LogOut, MoreHorizontal, X, Clipboard, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSidebar } from '@/lib/SidebarContext';
import toast from 'react-hot-toast';

export default function DoctorSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isOpen, close } = useSidebar();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        await supabase?.auth.signOut();
        toast.success('Logged out successfully');
        router.push('/login');
    };

    const menuItems = [
        { name: 'Home', icon: Home, href: '/doctor/dashboard' },
        { name: 'My Patients', icon: Users, href: '/doctor/patients' },
        { name: 'OPD & Appointments', icon: Calendar, href: '/doctor/opd' },
        { name: 'Prescriptions', icon: FileText, href: '/doctor/prescriptions' },
        { name: 'Telemedicine', icon: Video, href: '/doctor/telemedicine' },
    ];

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[4999]"
                    onClick={close}
                />
            )}

            {/* Sidebar Content */}
            <aside className={`
                fixed top-0 left-0 h-screen w-72 bg-white flex flex-col border-r border-gray-100 z-[9999] transition-transform duration-300 ease-in-out shadow-2xl
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>

                {/* Logo Area */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <img src="/logo.png" alt="HealthON" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#4a2b3d] tracking-tight uppercase leading-none">HealthON</h2>
                            <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">Doctor Portal</p>
                        </div>
                    </div>
                    <button onClick={close} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full lg:hidden">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={close}
                                className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-plum-50 text-plum-700 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon size={20} className={`transition-colors ${isActive ? 'text-plum-600' : 'text-gray-400 group-hover:text-plum-600'}`} />
                                <span className="text-sm font-bold tracking-wide">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Area */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded-xl bg-white border border-gray-200 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all text-gray-600 text-xs font-black uppercase tracking-widest shadow-sm"
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>

            </aside>
        </>
    );
}
