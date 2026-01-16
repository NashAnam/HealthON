'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, MapPin, Calendar, Save, Camera, ArrowLeft, Heart, Shield, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patient, setPatient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        dob: '',
        gender: '',
        bloodGroup: '',
        address: '',
        height: '',
        weight: '',
        emergencyContact: '',
        allergies: '',
        medicalHistory: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return router.push('/login');

            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (error) throw error;

            setPatient(data);
            setFormData({
                name: data.name || '',
                email: data.email || session.user.email,
                phone: data.phone || '',
                dob: data.dob || '',
                gender: data.gender || '',
                bloodGroup: data.blood_group || '',
                address: data.address || '',
                height: data.height || '',
                weight: data.weight || '',
                emergencyContact: data.emergency_contact || '',
                allergies: data.allergies || '',
                medicalHistory: data.medical_history || ''
            });
        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Sanitize payload to prevent 400 errors (e.g. empty strings for numbers/dates)
            const updates = {
                name: formData.name,
                phone: formData.phone || null,
                dob: formData.dob || null,
                gender: formData.gender || null,
                blood_group: formData.bloodGroup || null,
                address: formData.address || null,
                height: formData.height ? parseFloat(formData.height) : null,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                emergency_contact: formData.emergencyContact || null,
                allergies: formData.allergies || null,
            };

            console.log('Saving profile updates:', updates);

            const { error } = await supabase
                .from('patients')
                .update(updates)
                .eq('id', patient.id);

            if (error) throw error;
            toast.success('Profile updated successfully!');
            router.refresh();
        } catch (error) {
            console.error('Error saving profile:', error);
            // Show specific error message if available
            toast.error(`Failed to update: ${error.message || 'Check your inputs'}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-plum-800 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-surface pb-20">
            {/* Header */}
            <div className="bg-[#4a2b3d] pt-8 pb-20 px-6 rounded-b-[2.5rem] relative mb-16 shadow-xl">
                <div className="max-w-4xl mx-auto flex items-center justify-between text-white mb-6">
                    <button onClick={() => router.back()} className="flex items-center gap-2 p-2 pr-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold opacity-90">Back</span>
                    </button>
                    <h1 className="text-lg font-black uppercase tracking-widest">My Profile</h1>
                    <div className="w-10" />
                </div>

                {/* Profile Avatar Card */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-white rounded-[2rem] shadow-xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center text-white text-4xl font-black">
                            {patient?.name?.[0] || 'U'}
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 transition-all md:hidden">
                            <Camera size={16} />
                        </button>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h2 className="text-2xl font-black text-[#4a2b3d] uppercase tracking-tight">{formData.name}</h2>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Patient ID: #{patient?.id?.slice(0, 8)}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
                                Active Account
                            </span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1">
                                <Shield size={12} /> Insurance Verified
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-[#4a2b3d] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#3a2230] transition-all disabled:opacity-50 shadow-lg shadow-plum-900/20"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 space-y-8">

                {/* Personal Information */}
                <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-plum-50 rounded-xl flex items-center justify-center text-plum-700">
                            <User size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Edit Personal Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Full Name" icon={<User size={16} />} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <InputGroup label="Date of Birth" icon={<Calendar size={16} />} type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                        <InputGroup label="Gender" icon={<User size={16} />} type="select" options={['Male', 'Female', 'Other']} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} />
                        <InputGroup label="Blood Type" icon={<Heart size={16} />} type="select" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })} />
                    </div>
                </section>

                {/* Contact Information */}
                <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700">
                            <Phone size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Contact Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Email" icon={<Mail size={16} />} value={formData.email} disabled />
                        <InputGroup label="Phone Number" icon={<Phone size={16} />} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        <InputGroup label="Address" icon={<MapPin size={16} />} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        <InputGroup label="Emergency Contact" icon={<Shield size={16} />} placeholder="Name & Phone" value={formData.emergencyContact} onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} />
                    </div>
                </section>


                {/* Physical Stats (Optional) */}
                <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-700">
                            <Activity size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Physical Stats (Optional)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <InputGroup label="Height (cm)" icon={<Activity size={16} />} value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} />
                        <InputGroup label="Weight (kg)" icon={<Activity size={16} />} value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                        <div className="md:col-span-2">
                            <TextAreaGroup label="Allergies / Conditions" placeholder="List any known allergies or chronic conditions..." value={formData.allergies} onChange={e => setFormData({ ...formData, allergies: e.target.value })} />
                        </div>
                    </div>
                </section>

                {/* Mobile Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:hidden py-4 bg-[#4a2b3d] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#3a2230] transition-all disabled:opacity-50 shadow-xl shadow-plum-900/20 flex items-center justify-center gap-2"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>

            </div>
        </div>
    );
}

function InputGroup({ label, icon, type = "text", value, onChange, disabled, options }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <div className={`relative flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 transition-all focus-within:ring-2 focus-within:ring-plum-500/10 focus-within:border-plum-500/20 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <span className="text-gray-400 mr-3">{icon}</span>
                {type === 'select' ? (
                    <select
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        className="w-full py-3 bg-transparent text-sm font-bold text-gray-700 outline-none placeholder:font-medium"
                    >
                        <option value="">Select {label}</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        className="w-full py-3 bg-transparent text-sm font-bold text-gray-700 outline-none placeholder:font-medium"
                    />
                )}
            </div>
        </div>
    );
}

function TextAreaGroup({ label, placeholder, value, onChange }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-plum-500/10 focus:border-plum-500/20 resize-none transition-all"
            />
        </div>
    );
}
