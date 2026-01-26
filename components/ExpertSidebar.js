'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Users, Calendar, FileText, User, LogOut, X } from 'lucide-react';
import { Apple, Activity, Stethoscope, FlaskConical } from 'lucide-react';
import { useSidebar } from '@/lib/SidebarContext';
import { signOut } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ExpertSidebar({ role }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isOpen, close } = useSidebar();

    const handleLogout = async () => {
        try {
            await signOut();
            toast.success('Logged out successfully');
            router.push('/');
        } catch (error) {
            toast.error('Failed to logout');
        }
    };

    const roleConfig = {
        doctor: {
            icon: Stethoscope,
            color: 'teal',
            label: 'Doctor',
            links: [
                { href: '/doctor/dashboard', label: 'Dashboard', icon: Home },
                { href: '/doctor/patients', label: 'Patients', icon: Users },
                { href: '/doctor/opd', label: 'OPD', icon: Calendar },
                { href: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
                { href: '/doctor/telemedicine', label: 'Telemedicine', icon: Activity },
                { href: '/doctor/profile', label: 'Profile', icon: User },
            ]
        },
        nutritionist: {
            icon: Apple,
            color: 'green',
            label: 'Nutritionist',
            links: [
                { href: '/nutritionist/dashboard', label: 'Dashboard', icon: Home },
                { href: '/nutritionist/patients', label: 'Patients', icon: Users },
                { href: '/nutritionist/diet-plans', label: 'Diet Plans', icon: FileText },
                { href: '/nutritionist/appointments', label: 'Appointments', icon: Calendar },
                { href: '/nutritionist/profile', label: 'Profile', icon: User },
            ]
        },
        physiotherapist: {
            icon: Activity,
            color: 'orange',
            label: 'Physiotherapist',
            links: [
                { href: '/physiotherapist/dashboard', label: 'Dashboard', icon: Home },
                { href: '/physiotherapist/patients', label: 'Patients', icon: Users },
                { href: '/physiotherapist/exercise-plans', label: 'Exercise Plans', icon: FileText },
                { href: '/physiotherapist/sessions', label: 'Sessions', icon: Calendar },
                { href: '/physiotherapist/profile', label: 'Profile', icon: User },
            ]
        },
        lab: {
            icon: FlaskConical,
            color: 'blue',
            label: 'Lab',
            links: [
                { href: '/lab/dashboard', label: 'Dashboard', icon: Home },
                { href: '/lab/profile', label: 'Profile', icon: User },
            ]
        }
    };

    const config = roleConfig[role] || roleConfig.doctor;
    const RoleIcon = config.icon;

    const colorClasses = {
        teal: 'bg-teal-600',
        green: 'bg-green-600',
        orange: 'bg-orange-600',
        blue: 'bg-blue-600'
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={close}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${colorClasses[config.color]}`}>
                                    <RoleIcon className="w-5 h-5" />
                                </div>
                                <span className="text-xl font-black text-gray-900">HealthON</span>
                            </div>
                            <button
                                onClick={close}
                                className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{config.label} Portal</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {config.links.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname === link.href;
                                return (
                                    <li key={link.href}>
                                        <button
                                            onClick={() => {
                                                router.push(link.href);
                                                close();
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive
                                                    ? `${colorClasses[config.color]} text-white shadow-lg`
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {link.label}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
