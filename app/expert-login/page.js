'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Stethoscope, Heart } from 'lucide-react';
import { signInWithGoogle, getCurrentUser, identifyUserRole } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ExpertLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isReturningUser, setIsReturningUser] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });

    useEffect(() => {
        checkReturningStatus();
    }, []);

    const checkReturningStatus = async () => {
        // Check localStorage flag
        if (typeof window !== 'undefined') {
            const isReturning = localStorage.getItem('returning_user') === 'true';
            setIsReturningUser(isReturning);
        }

        const user = await getCurrentUser();
        if (user) {
            const { role } = await identifyUserRole(user.id);
            if (role !== 'unregistered') {
                localStorage.setItem('returning_user', 'true');
                router.replace(`/${role}/dashboard`);
            }
        }
    };

    const handleGoogleLogin = async () => {
        if (!isReturningUser && (!formData.name || !formData.phone)) {
            toast.error('Please fill in your name and phone number');
            return;
        }

        setLoading(true);
        try {
            if (!isReturningUser && typeof window !== 'undefined') {
                sessionStorage.setItem('temp_expert_data', JSON.stringify(formData));
            }
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (err) {
            toast.error(err.message || 'Failed to login');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            {/* Consistent Header Logo */}
            <div className="absolute top-8 left-8 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                <img src="/logo.png" alt="HealthON" className="w-10 h-10 rounded-xl shadow-sm" />
                <span className="text-2xl font-black tracking-tight text-[#1a1a2e]">HealthON</span>
            </div>

            <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-6 md:p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="w-20 h-20 bg-teal-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-teal-900/10 relative z-10">
                    <Stethoscope className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-2">Medical Expert Login</h1>
                <p className="text-gray-500 mb-8 font-medium">
                    {isReturningUser ? 'Welcome back, Doctor!' : 'Join our team of professionals'}
                </p>

                <div className="space-y-5 text-left relative z-10">
                    {!isReturningUser && (
                        <>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                                    placeholder="Dr. John Doe"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 10) setFormData({ ...formData, phone: value });
                                    }}
                                    maxLength={10}
                                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                                    placeholder="10-digit mobile"
                                />
                            </div>
                        </>
                    )}

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-teal-700 hover:bg-teal-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-teal-900/20 hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? 'Connecting...' : (
                            <>
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 bg-white rounded-full p-0.5" alt="Google" />
                                Login with Google
                            </>
                        )}
                    </button>

                    {isReturningUser && (
                        <button
                            onClick={() => setIsReturningUser(false)}
                            className="w-full text-xs font-bold text-gray-400 uppercase tracking-tighter hover:text-teal-700 transition-colors mt-4"
                        >
                            New expert? Register here
                        </button>
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 relative z-10">
                    <p className="text-gray-500 text-sm font-medium">
                        New to HealthON? <button onClick={() => router.push('/complete-profile')} className="text-teal-700 font-bold hover:underline">Register Practice</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
