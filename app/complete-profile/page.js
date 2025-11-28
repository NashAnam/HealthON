'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, createPatient, createDoctor, createLab, getPatient, getDoctor, getLab } from '@/lib/supabase';
import { User, Stethoscope, FlaskConical, ArrowRight, Phone, Mail, Calendar, MapPin, Award, Clock, FileText, Truck, DollarSign, ChevronLeft, CheckCircle2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const InputField = ({ icon: Icon, label, ...props }) => (
  <div className="space-y-2 group">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors ml-1">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
      </div>
      <input {...props} className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-medium" />
    </div>
  </div>
);

const TextAreaField = ({ icon: Icon, label, ...props }) => (
  <div className="space-y-2 group">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors ml-1">{label}</label>
    <div className="relative">
      <div className="absolute top-4 left-4 pointer-events-none">
        <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
      </div>
      <textarea {...props} className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-medium min-h-[100px]" />
    </div>
  </div>
);

export default function CompleteProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    // Patient: name, age, phone, email
    name: '', age: '', phone: '', email: '',
    // Doctor: name, qualification, experience, available_days, timings
    qualification: '', experience: '', available_days: '', timings: '',
    // Lab: name, address, license_number, tests_list, report_delivery_method
    address: '', license_number: '', tests_list: '', report_delivery_method: ''
  });

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace('/login');
        return;
      }
      setUser(currentUser);

      // Check if profile already exists
      const { data: patientData } = await getPatient(currentUser.id);
      if (patientData) {
        router.replace('/patient/dashboard');
        return;
      }

      const { data: doctorData } = await getDoctor(currentUser.id);
      if (doctorData) {
        router.replace('/doctor/dashboard');
        return;
      }

      const { data: labData } = await getLab(currentUser.id);
      if (labData) {
        router.replace('/lab/dashboard');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking profile:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userType) {
      toast.error('Please select your role');
      return;
    }
    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone are required');
      return;
    }

    setSubmitting(true);
    try {
      if (userType === 'patient') {
        if (!formData.age) {
          toast.error('Age is required');
          setSubmitting(false);
          return;
        }
        const result = await createPatient({
          user_id: user.id,
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          age: parseInt(formData.age),
          consent_given: false
        });
        if (result.error) {
          toast.error('Error: ' + result.error.message);
          setSubmitting(false);
          return;
        }
        toast.success('Profile Created!');
        router.push('/patient/consent');

      } else if (userType === 'doctor') {
        if (!agreedToTerms) {
          toast.error('Please accept the terms and conditions');
          setSubmitting(false);
          return;
        }
        const result = await createDoctor({
          user_id: user.id,
          name: formData.name,
          qualification: formData.qualification,
          experience: formData.experience,
          available_days: formData.available_days.split(',').map(day => day.trim()),
          timings: formData.timings,
          verified: true
        });
        if (result.error) {
          toast.error('Error: ' + result.error.message);
          setSubmitting(false);
          return;
        }
        toast.success('Doctor Profile Created!');
        // Small delay to ensure DB propagation
        setTimeout(() => {
          router.push('/doctor/dashboard');
        }, 1000);

      } else if (userType === 'lab') {
        if (!agreedToTerms) {
          toast.error('Please accept the terms and conditions');
          setSubmitting(false);
          return;
        }
        const result = await createLab({
          user_id: user.id,
          name: formData.name,
          address: formData.address,
          license_number: formData.license_number,
          tests_list: formData.tests_list,
          report_delivery_method: formData.report_delivery_method,
          verified: true
        });
        if (result.error) {
          toast.error('Error: ' + result.error.message);
          setSubmitting(false);
          return;
        }
        toast.success('Lab Profile Created!');
        setTimeout(() => {
          router.push('/lab/dashboard');
        }, 1000);
      }
    } catch (error) {
      toast.error('Error: ' + (error.message || 'Unknown error'));
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-6xl w-full grid md:grid-cols-5 bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <div className="md:col-span-2 bg-slate-50 p-10 md:p-14 flex flex-col justify-between relative overflow-hidden border-r border-slate-100">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-600/20">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-slate-900 tracking-tight">CareOn <br /> <span className="text-indigo-600">Healthcare.</span></h1>
            <p className="text-slate-500 leading-relaxed text-lg">Your trusted platform for managing health, appointments, and records.</p>
          </div>
          <div className="relative z-10 space-y-5 mt-12">
            <div className="flex items-center gap-4 text-sm font-medium text-slate-600 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <span>Secure Health Data</span>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-600 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <span>Verified Specialists</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-100 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-100 rounded-full blur-3xl -ml-20 -mb-20 opacity-50"></div>
        </div>

        <div className="md:col-span-3 p-10 md:p-14 bg-white max-h-[90vh] overflow-y-auto">
          {!userType ? (
            <div className="h-full flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Who are you?</h2>
              <p className="text-slate-500 mb-10 text-lg">Select your role to continue.</p>
              <div className="space-y-4">
                <RoleButton icon={User} title="Patient" desc="Find doctors & track health" onClick={() => setUserType('patient')} color="indigo" />
                <RoleButton icon={Stethoscope} title="Doctor" desc="Manage practice & patients" onClick={() => setUserType('doctor')} color="violet" />
                <RoleButton icon={FlaskConical} title="Lab Partner" desc="Diagnostic services & reports" onClick={() => setUserType('lab')} color="emerald" />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={() => { setUserType(''); setAgreedToTerms(false); }} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 mb-8 transition-colors group">
                <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                Back to Roles
              </button>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-4">
                <span className="capitalize">{userType}</span> Details
                <div className="h-px flex-1 bg-slate-100"></div>
              </h2>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <InputField icon={User} label="Full Name" placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  <InputField icon={Phone} label="Phone Number" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>

                {userType === 'patient' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <InputField icon={Calendar} label="Age" type="number" placeholder="Years" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
                      <InputField icon={Mail} label="Email (Optional)" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                  </>
                )}

                {userType === 'doctor' && (
                  <>
                    <InputField icon={Award} label="Qualification" placeholder="MBBS, MD" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                    <InputField icon={Clock} label="Experience" placeholder="5 years" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                    <InputField icon={Calendar} label="Available Days" placeholder="Mon, Wed, Fri" value={formData.available_days} onChange={e => setFormData({ ...formData, available_days: e.target.value })} />
                    <InputField icon={Clock} label="Timings" placeholder="9 AM - 5 PM" value={formData.timings} onChange={e => setFormData({ ...formData, timings: e.target.value })} />
                  </>
                )}

                {userType === 'lab' && (
                  <>
                    <InputField icon={MapPin} label="Lab Address" placeholder="123 Main St, City" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    <InputField icon={FileText} label="License Number" placeholder="LAB123456" value={formData.license_number} onChange={e => setFormData({ ...formData, license_number: e.target.value })} />
                    <TextAreaField icon={FileText} label="Available Tests with MRPs" placeholder="CBC - ₹500, Blood Sugar - ₹200" value={formData.tests_list} onChange={e => setFormData({ ...formData, tests_list: e.target.value })} />
                    <InputField icon={DollarSign} label="Home Collection Charge (Optional)" placeholder="₹100" value={formData.home_collection_charges} onChange={e => setFormData({ ...formData, home_collection_charges: e.target.value })} />
                    <InputField icon={Truck} label="Report Delivery Method" placeholder="Email, Physical Copy" value={formData.report_delivery_method} onChange={e => setFormData({ ...formData, report_delivery_method: e.target.value })} />
                  </>
                )}

                {(userType === 'doctor' || userType === 'lab') && (
                  <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50 transition-all cursor-pointer group">
                    <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 h-5 w-5 cursor-pointer rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">I accept the Terms & Conditions</p>
                      <p className="text-sm text-slate-500 mt-1">I agree to provide accurate information and follow platform guidelines.</p>
                    </div>
                  </label>
                )}

                <button onClick={handleSubmit} disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3 transform hover:-translate-y-0.5">
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const RoleButton = ({ icon: Icon, title, desc, onClick, color }) => {
  const colors = {
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    violet: 'from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700',
    emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
  };
  return (
    <button onClick={onClick} className={`w-full p-6 rounded-3xl bg-gradient-to-r ${colors[color]} text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-6 group`}>
      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
        <Icon className="w-8 h-8" />
      </div>
      <div className="text-left flex-1">
        <h3 className="text-2xl font-bold mb-1">{title}</h3>
        <p className="text-white/80 text-sm">{desc}</p>
      </div>
      <ArrowRight className="w-6 h-6 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </button>
  );
};
