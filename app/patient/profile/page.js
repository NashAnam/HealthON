'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, supabase } from '@/lib/supabase';
import { User, Mail, Phone, Calendar, Droplet, MapPin, LogOut, Edit2, Shield, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return router.push('/login');

            const { data } = await getPatient(user.id);
            if (data) {
                setPatient(data);
                setFormData(data);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            const user = await getCurrentUser();
            console.log('Current user:', user?.id);
            console.log('Patient data:', patient);
            console.log('Form data to update:', formData);

            if (!user) {
                toast.error('Please login again');
                return router.push('/login');
            }

            // Only update fields that exist in the database
            const updatePayload = {
                name: formData.name,
                phone: formData.phone,
                address: formData.address
            };

            console.log('Update payload:', updatePayload);
            console.log('Updating for user_id:', user.id);

            const { data, error } = await supabase
                .from('patients')
                .update(updatePayload)
                .eq('user_id', user.id)
                .select()
                .single();

            console.log('Update result - data:', data);
            console.log('Update result - error:', error);

            if (error) {
                console.error('Supabase error details:', JSON.stringify(error, null, 2));
                throw new Error(error.message || error.hint || 'Failed to update profile');
            }

            if (!data) {
                throw new Error('No data returned from update');
            }

            setPatient(data);
            setFormData(data);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('Signed out successfully');
            router.push('/login');
        } catch (error) {
            toast.error('Error signing out');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plum-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/patient/dashboard')}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 md:py-12">
                <div className="max-w-4xl mx-auto">

                    {/* Main Profile Card */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100">
                        <div className="h-48 bg-gradient-to-r from-plum-700 to-plum-900 relative">
                            <div className="absolute -bottom-16 left-8 p-1 bg-white rounded-full">
                                <div className="w-32 h-32 rounded-full bg-plum-100 flex items-center justify-center text-4xl font-bold text-plum-700 border-4 border-white shadow-md">
                                    {patient?.name?.[0] || 'U'}
                                </div>
                            </div>
                        </div>

                        <div className="pt-20 px-8 pb-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                <div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name || ''}
                                            onChange={handleInputChange}
                                            className="text-3xl font-bold text-gray-900 mb-1 border-b-2 border-gray-200 focus:border-plum-600 outline-none w-full"
                                        />
                                    ) : (
                                        <h2 className="text-3xl font-bold text-gray-900 mb-1">{patient?.name || 'User'}</h2>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Shield className="w-4 h-4 text-teal-600" />
                                        <span className="text-sm font-medium">Verified Patient Account</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={() => { setIsEditing(false); setFormData(patient); }}
                                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateProfile}
                                                disabled={saving}
                                                className="px-5 py-2.5 bg-plum-700 hover:bg-plum-800 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                                            >
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                                        >
                                            <Edit2 size={16} /> Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">

                                {/* Contact Info */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Contact Information</h3>

                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Email Address</p>
                                            <p className="font-semibold text-gray-900">{patient?.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Phone size={20} />
                                        </div>
                                        <div className="w-full">
                                            <p className="text-xs text-gray-400 font-medium">Phone Number</p>
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone || ''}
                                                    onChange={handleInputChange}
                                                    className="font-semibold text-gray-900 w-full border-b border-gray-200 focus:border-plum-600 outline-none pb-1"
                                                    placeholder="Enter phone number"
                                                />
                                            ) : (
                                                <p className="font-semibold text-gray-900">{patient?.phone || 'Not provided'}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="w-full">
                                            <p className="text-xs text-gray-400 font-medium">Address</p>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={formData.address || ''}
                                                    onChange={handleInputChange}
                                                    className="font-semibold text-gray-900 w-full border-b border-gray-200 focus:border-plum-600 outline-none pb-1"
                                                    placeholder="Enter address"
                                                />
                                            ) : (
                                                <p className="font-semibold text-gray-900">{patient?.address || 'Not provided'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-white border border-rose-100 text-rose-600 py-4 rounded-2xl font-bold shadow-sm hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={20} /> Sign Out of HealthOn
                    </button>

                </div>
            </div>
        </div>
    );
}
