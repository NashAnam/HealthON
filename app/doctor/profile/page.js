'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, MapPin, Calendar, Save, Camera, ArrowLeft, Award, Stethoscope, Building } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [doctor, setDoctor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        experience: '',
        licenseNumber: '',
        hospital: '',
        consultationFee: '',
        bio: '',
        address: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return router.push('/login');

            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (error) throw error;

            setDoctor(data);
            setFormData({
                name: data.name || '',
                email: data.email || session.user.email,
                phone: data.phone || '',
                specialty: data.specialty || '',
                experience: data.experience || '',
                licenseNumber: data.license_number || '',
                hospital: data.hospital_name || '',
                consultationFee: data.consultation_fee || '',
                bio: data.bio || '',
                address: data.address || ''
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
            const { error } = await supabase
                .from('doctors')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    specialty: formData.specialty,
                    experience: formData.experience ? parseInt(formData.experience) : null,
                    license_number: formData.licenseNumber,
                    hospital_name: formData.hospital,
                    consultation_fee: formData.consultationFee ? parseFloat(formData.consultationFee) : null,
                    bio: formData.bio,
                    address: formData.address
                })
                .eq('id', doctor.id);

            if (error) throw error;
            toast.success('Profile updated successfully!');
            router.refresh();
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-20">
            {/* Header */}
            <div className="bg-[#1e1e1e] pt-8 pb-20 px-6 rounded-b-[2.5rem] relative mb-16 shadow-xl">
                <div className="max-w-4xl mx-auto flex items-center justify-between text-white mb-6">
                    <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-black uppercase tracking-widest">Doctor Profile</h1>
                    <div className="w-10" />
                </div>

                {/* Profile Avatar Card */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-white rounded-[2rem] shadow-xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-4xl font-black">
                            {doctor?.name?.[0] || 'D'}
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-plum-600 text-white rounded-full shadow-lg hover:bg-plum-700 transition-all md:hidden">
                            <Camera size={16} />
                        </button>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{formData.name}</h2>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
                            {formData.specialty || 'General Physician'} • ID: #{doctor?.id?.slice(0, 8)}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-teal-100 flex items-center gap-1">
                                <Award size={12} /> Verified Doctor
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all disabled:opacity-50 shadow-lg shadow-teal-900/20"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 space-y-8">

                {/* Professional Information */}
                <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                            <Stethoscope size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Professional Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Full Name" icon={<User size={16} />} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <InputGroup label="Email" icon={<Mail size={16} />} value={formData.email} disabled />
                        <InputGroup label="Phone Number" icon={<Phone size={16} />} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        <InputGroup label="Specialty" icon={<Stethoscope size={16} />} value={formData.specialty} onChange={e => setFormData({ ...formData, specialty: e.target.value })} />
                        <InputGroup label="License Number" icon={<Award size={16} />} value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })} />
                        <InputGroup label="Experience (Years)" icon={<Calendar size={16} />} type="number" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                    </div>
                </section>

                {/* Clinic / Practice Details */}
                <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-plum-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="w-10 h-10 bg-plum-50 rounded-xl flex items-center justify-center text-plum-700">
                            <Building size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Practice Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <InputGroup label="Hospital / Clinic Name" icon={<Building size={16} />} value={formData.hospital} onChange={e => setFormData({ ...formData, hospital: e.target.value })} />
                        <InputGroup label="Consultation Fee (INR)" icon={<span className="text-xs font-bold">₹</span>} type="number" value={formData.consultationFee} onChange={e => setFormData({ ...formData, consultationFee: e.target.value })} />
                        <div className="md:col-span-2">
                            <InputGroup label="Clinic Address" icon={<MapPin size={16} />} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                    </div>

                    <div className="mt-6 space-y-6 relative z-10">
                        <TextAreaGroup label="Professional Bio" placeholder="Tell patients about your expertise..." value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                    </div>
                </section>

                {/* Mobile Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:hidden py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all disabled:opacity-50 shadow-xl shadow-teal-900/20 flex items-center justify-center gap-2"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>

            </div>
        </div>
    );
}

function InputGroup({ label, icon, type = "text", value, onChange, disabled }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <div className={`relative flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 transition-all focus-within:ring-2 focus-within:ring-teal-500/10 focus-within:border-teal-500/20 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <span className="text-gray-400 mr-3 flex items-center justify-center w-4">{icon}</span>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className="w-full py-3 bg-transparent text-sm font-bold text-gray-700 outline-none placeholder:font-medium"
                />
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
                rows={4}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500/20 resize-none transition-all"
            />
        </div>
    );
}
