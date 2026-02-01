'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, getCurrentUser, identifyUserRole } from '@/lib/supabase';
import { Activity, Heart, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: ''
  });
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    checkReturningStatus();
  }, []);

  const checkReturningStatus = async () => {
    // Check localStorage flag
    if (typeof window !== 'undefined') {
      const isReturning = localStorage.getItem('returning_user') === 'true';
      setIsReturningUser(isReturning);
    }

    // Also check if already logged in and redirect
    const user = await getCurrentUser();
    if (user) {
      const { role } = await identifyUserRole(user.id);
      if (role !== 'unregistered') {
        localStorage.setItem('returning_user', 'true');
        router.replace(`/${role}/dashboard`);
      }
    }
  };

  const handleLogin = async () => {
    if (!formData.name || !formData.phone || !formData.age) {
      toast.error('Please fill in all details before continuing');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit Indian phone number (starting with 6-9)');
      return;
    }

    setLoading(true);
    try {
      // Store patient data in Supabase after OAuth
      if (typeof window !== 'undefined') {
        // Store temporarily in localStorage (will be used after OAuth redirect)
        localStorage.setItem('pending_patient_data', JSON.stringify(formData));
      }

      // Redirect to patient dashboard after OAuth
      const { error } = await signInWithGoogle(`${window.location.origin}/patient/dashboard`);
      if (error) throw error;
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-x-hidden w-full">
      {/* Consistent Header Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
        <img src="/logo.png" alt="HealthON" className="w-10 h-10 rounded-xl shadow-sm" />
        <span className="text-2xl font-black tracking-tight text-[#1a1a2e]">HealthON</span>
      </div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-[32px] shadow-2xl p-6 md:p-10 relative z-10 text-center border border-white/50">

        <div className="w-20 h-20 bg-[#602E5A] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-900/20 p-4">
          <Activity className="w-full h-full text-white" />
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2 block">Login</h1>
        <p className="text-gray-500 mb-8 text-lg font-medium">
          {isReturningUser ? 'Welcome back! Sign in to continue.' : 'Track your health journey'}
        </p>

        <div className="space-y-5 text-left bg-white p-1 rounded-2xl">
          {!isReturningUser && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#602E5A]/20 font-medium"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only digits
                    if (value.length <= 10) {
                      setFormData({ ...formData, phone: value });
                    }
                  }}
                  maxLength={10}
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#602E5A]/20 font-medium"
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 2 && parseInt(value) <= 99) {
                      setFormData({ ...formData, age: value });
                    }
                  }}
                  maxLength={2}
                  max={99}
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#602E5A]/20 font-medium"
                  placeholder="Age (max 99)"
                />
              </div>
            </>
          )}

          <button
            onClick={isReturningUser ? () => signInWithGoogle() : handleLogin}
            disabled={loading}
            className="w-full bg-[#602E5A] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-purple-900/20 hover:bg-[#4a2135] transition-all mt-4 flex items-center justify-center gap-3 relative overflow-hidden group hover:-translate-y-1"
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
              className="w-full text-xs font-bold text-gray-400 uppercase tracking-tighter hover:text-[#602E5A] transition-colors mt-4"
            >
              New user? Register here
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
