'use client';
import { Home, Calendar, FileText, User, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Home', icon: Home, href: '/patient/dashboard' },
        { name: 'Appts', icon: Calendar, href: '/patient/appointments' },
        { name: 'Records', icon: FileText, href: '/patient/reports' },
        { name: 'Reminders', icon: Bell, href: '/patient/reminders' },
        { name: 'Profile', icon: User, href: '/patient/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/80 backdrop-blur-xl border-t border-gray-100 z-[1000] pb-safe">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center gap-1 min-w-[64px] relative tap-highlight-transparent"
                        >
                            <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'text-[#4a2b3d]' : 'text-gray-400'}`}>
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${isActive ? 'text-[#4a2b3d]' : 'text-gray-400'}`}>
                                {item.name}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavDot"
                                    className="absolute -top-1 w-1 h-1 bg-[#4a2b3d] rounded-full"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
