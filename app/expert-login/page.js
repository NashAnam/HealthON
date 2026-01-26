'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Stethoscope, Heart } from 'lucide-react';
import { signInWithGoogle, getCurrentUser, getDoctor, getLab, getNutritionist, getPhysiotherapist } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ExpertLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkExistingUser();
    }, []);

    const checkExistingUser = async () => {
        try {
            const user = await getCurrentUser();
            if (user) {
                // Check which type of expert profile exists and redirect
                const [doctorRes, labRes, nutritionistRes, physiotherapistRes] = await Promise.all([
                    getDoctor(user.id),
                    getLab(user.id),
                    getNutritionist(user.id),
                    getPhysiotherapist(user.id)
                ]);

                if (doctorRes.data) {
                    router.replace('/doctor/dashboard');
                } else if (labRes.data) {
                    router.replace('/lab/dashboard');
                } else if (nutritionistRes.data) {
                    router.replace('/nutritionist/dashboard');
                } else if (physiotherapistRes.data) {
                    router.replace('/physiotherapist/dashboard');
                } else {
                    // User is logged in but has no expert profile
                    router.replace('/complete-profile');
                }
            }
        } catch (error) {
            console.error('Error checking user:', error);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
            // After successful login, user will be redirected by OAuth callback
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

            <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="w-20 h-20 bg-teal-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-teal-900/10 relative z-10">
                    <Stethoscope className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-2">Medical Expert Login</h1>
                <p className="text-gray-500 mb-8 font-medium">Doctors, Labs, Nutritionists & Physiotherapists</p>

                <div className="space-y-5 text-left relative z-10">
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
