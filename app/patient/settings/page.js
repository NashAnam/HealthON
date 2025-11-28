'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, updatePatient } from '@/lib/supabase';
import { User, Phone, Ruler, Weight, ChevronLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        height: '',
        weight: '',
        age: '',
        gender: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) return router.replace('/login');
            setUser(currentUser);

            const { data, error } = await getPatient(currentUser.id);
            if (error) throw error;

            if (data) {
                setFormData({
                    name: data.name || '',
                    phone: data.phone || '',
                    height: data.height || '',
                    weight: data.weight || '',
                    age: data.age || ''
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await updatePatient(user.id, formData);
            if (error) throw error;
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error.message || error);
            console.error('Full error object:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-900">
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h2 className="text-xl font-bold mb-6">Edit Profile</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="Phone Number"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Height (cm)</label>
                                <div className="relative">
                                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="number"
                                        name="height"
                                        value={formData.height}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="170"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Weight (kg)</label>
                                <div className="relative">
                                    <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="70"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}
