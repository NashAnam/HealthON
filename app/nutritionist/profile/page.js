'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, MapPin, Calendar, Save, Camera, ArrowLeft, Award, Apple, Building } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NutritionistProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [nutritionist, setNutritionist] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        experience: '',
        qualification: '',
        consultationFee: '',
        address: '',
        available_days: [],
        timings: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return router.push('/expert-login');

            const { data, error } = await supabase
                .from('nutritionists')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (error) throw error;

            setNutritionist(data);
            setFormData({
                name: data.name || '',
                email: session.user.email,
                phone: data.phone || '',
                specialization: data.specialization || '',
                experience: data.experience || '',
                qualification: data.qualification || '',
                consultationFee: data.consultation_fee || '',
                address: data.address || '',
                available_days: data.available_days || [],
                timings: data.timings || ''
            });
        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.phone) {
            toast.error('Name and Phone Number are required');
            return;
        }

        setSaving(true);
        try {
            const { error: updateError } = await supabase
                .from('nutritionists')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    specialization: formData.specialization,
                    experience: formData.experience,
                    qualification: formData.qualification,
                    consultation_fee: formData.consultationFee,
                    address: formData.address,
                    available_days: formData.available_days,
                    timings: formData.timings
                })
                .eq('id', nutritionist.id);

            if (updateError) throw updateError;
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Save Error:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1b3c1b] to-[#0d1f0d] pt-8 pb-20 px-6 rounded-b-[2.5rem] relative mb-16 shadow-xl">
                <div className="max-w-4xl mx-auto flex items-center justify-between text-white mb-6">
                    <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-black uppercase tracking-widest">Nutritionist Profile</h1>
                    <div className="w-10" />
                </div>

                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-white rounded-[2rem] shadow-xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-4xl font-black">
                        {nutritionist?.name?.[0] || 'N'}
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{formData.name}</h2>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
                            {formData.specialization || 'Clinical Nutritionist'} • ID: #{nutritionist?.id?.slice(0, 8)}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1">
                                <Award size={12} /> Certified Nutritionist
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50 shadow-lg shadow-green-900/20"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 space-y-8">
                <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <Apple size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Professional Info</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Full Name" icon={<User size={16} />} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <InputGroup label="Email" icon={<Mail size={16} />} value={formData.email} disabled />
                        <InputGroup label="Phone" icon={<Phone size={16} />} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        <InputGroup label="Specialization" icon={<Award size={16} />} value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                        <InputGroup label="Qualifications" icon={<Award size={16} />} value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                        <InputGroup label="Experience" icon={<Calendar size={16} />} value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                    </div>
                </section>

                <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <MapPin size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Consultation Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Clinic/Hospital" icon={<Building size={16} />} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        <InputGroup label="Fee (INR)" icon={<span className="text-xs font-bold">₹</span>} type="number" value={formData.consultationFee} onChange={e => setFormData({ ...formData, consultationFee: e.target.value })} />
                    </div>
                </section>
            </div>
        </div>
    );
}

function InputGroup({ label, icon, type = "text", value, onChange, disabled }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <div className={`relative flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 transition-all focus-within:ring-2 focus-within:ring-green-500/10 focus-within:border-green-500/20 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <span className="text-gray-400 mr-3 flex items-center justify-center w-4">{icon}</span>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className="w-full py-3 bg-transparent text-sm font-bold text-gray-700 outline-none"
                />
            </div>
        </div>
    );
}
