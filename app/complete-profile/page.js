'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, createDoctor, createLab, createNutritionist, createPhysiotherapist, getPatient, getDoctor, getLab, getNutritionist, getPhysiotherapist, signInWithGoogle } from '@/lib/supabase';
import { User, Stethoscope, FlaskConical, ArrowRight, Phone, Mail, Calendar, MapPin, Award, Clock, FileText, Truck, DollarSign, ChevronLeft, CheckCircle2, Activity, Apple, UserPlus, Heart, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const InputField = ({ icon: Icon, label, ...props }) => (
  <div className="space-y-2 group">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider group-focus-within:text-[#602E5A] transition-colors ml-1">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-[#602E5A] transition-colors" />
      </div>
      <input {...props} className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#602E5A]/20 focus:border-[#602E5A] focus:bg-white transition-all font-medium" />
    </div>
  </div>
);

const TextAreaField = ({ icon: Icon, label, ...props }) => (
  <div className="space-y-2 group">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider group-focus-within:text-[#602E5A] transition-colors ml-1">{label}</label>
    <div className="relative">
      <div className="absolute top-4 left-4 pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-[#602E5A] transition-colors" />
      </div>
      <textarea {...props} className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#602E5A]/20 focus:border-[#602E5A] focus:bg-white transition-all font-medium min-h-[100px]" />
    </div>
  </div>
);

export default function CompleteProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', qualification: '', experience: '', available_days: '', timings: '',
    address: '', tests_list: '', report_delivery_method: '',
    specialty: '', fee: '', labType: ''
  });

  useEffect(() => {
    const handlePatientFlow = async () => {
      // 1. Check for temp patient data from login
      if (typeof window !== 'undefined') {
        const tempPatientStr = sessionStorage.getItem('temp_patient_data');
        if (tempPatientStr) {
          try {
            const user = await getCurrentUser();
            if (user) {
              const patientData = JSON.parse(tempPatientStr);
              // Create patient profile
              await createPatient({
                user_id: user.id,
                name: patientData.name,
                phone: patientData.phone,
                age: patientData.age,
                email: user.email
              });

              // Clear temp data
              sessionStorage.removeItem('temp_patient_data');

              // Redirect to patient dashboard
              const redirectPath = sessionStorage.getItem('post_auth_redirect') || '/patient/dashboard';
              sessionStorage.removeItem('post_auth_redirect');
              router.replace(redirectPath);
              return;
            }
          } catch (err) {
            console.error('Error creating patient profile:', err);
            toast.error('Failed to create profile. Please try again.');
          }
        }
      }

      checkProfile();
      loadTemporaryData();
    };

    handlePatientFlow();
  }, []);

  const loadTemporaryData = () => {
    if (typeof window !== 'undefined') {
      const savedForm = sessionStorage.getItem('temp_expert_form');
      const savedMeta = sessionStorage.getItem('temp_expert_data');
      const savedType = sessionStorage.getItem('expert_type');

      if (savedForm) {
        setFormData(prev => ({ ...prev, ...JSON.parse(savedForm) }));
        sessionStorage.removeItem('temp_expert_form');
      }

      if (savedMeta) {
        const meta = JSON.parse(savedMeta);
        setFormData(prev => ({ ...prev, name: meta.name || prev.name, phone: meta.phone || prev.phone }));
        sessionStorage.removeItem('temp_expert_data');
      }

      if (savedType) {
        setUserType(savedType);
      }
    }
  };

  const checkProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);

        // Check if user already has a profile and redirect accordingly
        const [patientRes, doctorRes, labRes, nutritionistRes, physiotherapistRes] = await Promise.all([
          getPatient(currentUser.id),
          getDoctor(currentUser.id),
          getLab(currentUser.id),
          getNutritionist(currentUser.id),
          getPhysiotherapist(currentUser.id)
        ]);

        if (patientRes.data) {
          if (typeof window !== 'undefined') {
            // If we're on complete-profile but acts as a patient, maybe we should redirect?
            // Unless they explicitly want to become an expert?
            // For now, if they have a patient profile, we assume they are a logging-in patient
            // UNLESS they clicked "Join Team" which wouldn't have set temp_patient_data

            // Check if they just came from Login Page (Login as Patient)
            // We can infer this if they hit this page without specific expert intent
            router.replace('/patient/dashboard');
            return;
          }
        }

        if (doctorRes.data) {
          router.replace('/doctor/dashboard');
          return;
        }
        if (labRes.data) {
          router.replace('/lab/dashboard');
          return;
        }
        if (nutritionistRes.data) {
          router.replace('/nutritionist/dashboard');
          return;
        }
        if (physiotherapistRes.data) {
          router.replace('/physiotherapist/dashboard');
          return;
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking profile:', error);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (type) => {
    try {
      setSubmitting(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('expert_type', type);
        sessionStorage.setItem('temp_expert_form', JSON.stringify(formData));

        // Explicitly redirect back to valid complete-profile page
        const redirectUrl = `${window.location.origin}/complete-profile`;
        const { error } = await signInWithGoogle(redirectUrl);
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!user) {
      toast.error('Please login with Google first');
      return;
    }

    if (!formData.name || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit Indian phone number (starting with 6-9)');
      return;
    }

    setSubmitting(true);
    try {
      let result;
      const profileData = {
        user_id: user.id,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      };

      let processedDays = [];
      if (Array.isArray(formData.available_days)) {
        processedDays = formData.available_days;
      } else {
        const daysInput = formData.available_days || 'Mon-Sat';
        if (daysInput.toLowerCase().includes('-')) {
          // Handle range like Mon-Sat
          processedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        } else {
          // Handle comma separated list
          processedDays = daysInput.split(',').map(d => d.trim()).filter(Boolean);
        }
      }

      if (userType === 'doctor') {
        result = await createDoctor({
          ...profileData,
          specialty: formData.specialty,
          qualification: formData.qualification,
          experience: parseInt(formData.experience) || 0,
          fee: parseFloat(formData.fee) || 0,
          timings: formData.timings,
          available_days: processedDays
        });
      } else if (userType === 'lab') {
        result = await createLab({
          ...profileData,
          tests_list: formData.tests_list,
          report_delivery_method: formData.report_delivery_method
        });
      } else if (userType === 'nutritionist') {
        result = await createNutritionist({
          ...profileData,
          qualification: formData.qualification,
          experience: parseInt(formData.experience) || 0,
          fee: parseFloat(formData.fee) || 0,
          timings: formData.timings,
          available_days: processedDays
        });
      } else if (userType === 'physiotherapist') {
        result = await createPhysiotherapist({
          ...profileData,
          qualification: formData.qualification,
          experience: parseInt(formData.experience) || 0,
          fee: parseFloat(formData.fee) || 0,
          timings: formData.timings,
          available_days: processedDays
        });
      }

      if (!result) {
        throw new Error(`Profile creation failed: Unsupported professional type "${userType}"`);
      }

      if (result.error) throw result.error;

      toast.success('Profile created successfully!');
      if (typeof window !== 'undefined') {
        localStorage.setItem('returning_user', 'true');
      }

      if (userType === 'doctor') router.push('/doctor/dashboard');
      else if (userType === 'lab') router.push('/lab/dashboard');
      else if (userType === 'nutritionist') router.push('/nutritionist/dashboard');
      else if (userType === 'physiotherapist') router.push('/physiotherapist/dashboard');

    } catch (error) {
      console.error('Profile creation error full object:', error);
      console.error('Profile creation error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast.error('Failed to create profile: ' + (error.message || 'Unknown database error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#602E5A]"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">

      {/* Consistent Header Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
        <img src="/logo.png" alt="HealthON" className="w-10 h-10 rounded-xl shadow-sm" />
        <span className="text-2xl font-black tracking-tight text-[#1a1a2e]">HealthON</span>
      </div>

      <div className="max-w-4xl w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 mt-16">
        <div className="p-6 md:p-14 bg-white max-h-[85vh] overflow-y-auto">
          {!userType ? (
            <div className="h-full flex flex-col justify-center">
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 rounded-full bg-purple-50 text-[#602E5A] font-bold text-xs uppercase tracking-widest mb-4">Professional Registration</span>
                <h2 className="text-4xl font-black text-gray-900 mb-4">Join Our Medical Team</h2>
                <p className="text-gray-500 text-lg max-w-lg mx-auto">Select your area of expertise to create your professional profile.</p>
              </div>

              {/* Enhanced Grid Layout */}
              <div className="grid md:grid-cols-2 gap-6">
                <RoleButton icon={Stethoscope} title="Doctor" desc="MBBS, MD, Specialists" onClick={() => setUserType('doctor')} color="teal" />
                <RoleButton icon={FlaskConical} title="Lab Partner" desc="Diagnostic Centers" onClick={() => setUserType('lab')} color="blue" />
                <RoleButton icon={Apple} title="Nutritionist" desc="Diet & Wellness Experts" onClick={() => setUserType('nutritionist')} color="green" />
                <RoleButton icon={Activity} title="Physiotherapist" desc="Physical Therapy Pros" onClick={() => setUserType('physiotherapist')} color="orange" />
              </div>

              <div className="mt-12 text-center">
                <p className="text-gray-400 text-sm font-medium">Already have an account? <button onClick={() => router.push('/expert-login')} className="text-[#602E5A] font-bold hover:underline">Login here</button></p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Header for Form */}
              <div className="bg-white rounded-2xl p-0 w-full mb-8">
                <button
                  onClick={() => {
                    setUserType(null);
                    setFormData({
                      name: '', phone: '', qualification: '', experience: '', available_days: '', timings: '',
                      address: '', tests_list: '', report_delivery_method: '',
                      specialty: '', fee: '', bio: '', labType: ''
                    });
                  }}
                  className="mb-6 flex items-center gap-2 text-slate-500 hover:text-[#602E5A] transition-colors text-sm font-bold uppercase tracking-wider"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Selection
                </button>

                <div className="text-center mb-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${userType === 'doctor' ? 'bg-purple-100 text-[#602E5A]' : userType === 'lab' ? 'bg-blue-100 text-blue-600' : userType === 'nutritionist' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {userType === 'doctor' && <Stethoscope className="w-8 h-8" />}
                    {userType === 'lab' && <FlaskConical className="w-8 h-8" />}
                    {userType === 'nutritionist' && <Apple className="w-8 h-8" />}
                    {userType === 'physiotherapist' && <Activity className="w-8 h-8" />}
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 capitalize mb-2">{userType} Profile</h2>
                  <p className="text-slate-500 font-medium">Enter your professional details</p>
                </div>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField icon={User} label="Full Name" placeholder={userType === 'lab' ? "Lab Name" : "Dr. Name"} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <InputField
                      icon={Phone}
                      label="Phone Number"
                      type="text"
                      placeholder="10-digit mobile"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  {(userType === 'doctor' || userType === 'nutritionist' || userType === 'physiotherapist') && (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <InputField icon={Award} label="Qualification" placeholder="Degree/Certification" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                        {userType === 'doctor' ? (
                          <InputField icon={Stethoscope} label="Specialty" placeholder="e.g. Cardiologist" value={formData.specialty} onChange={e => setFormData({ ...formData, specialty: e.target.value })} />
                        ) : (
                          <InputField icon={Activity} label="Specialization Area" placeholder="e.g. Sports Nutrition" value={formData.specialty} onChange={e => setFormData({ ...formData, specialty: e.target.value })} />
                        )}
                      </div>



                      <div className="grid md:grid-cols-2 gap-6">
                        <InputField icon={Clock} label="Experience (Years)" type="number" placeholder="Years" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                        <InputField icon={DollarSign} label="Consultation Fee (₹)" type="number" placeholder="₹" value={formData.fee} onChange={e => setFormData({ ...formData, fee: e.target.value })} />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <DaySelector
                          value={formData.available_days}
                          onChange={days => setFormData({ ...formData, available_days: days })}
                        />
                        <TimeRangeSelector
                          value={formData.timings}
                          onChange={time => setFormData({ ...formData, timings: time })}
                        />
                      </div>
                      <InputField icon={MapPin} label="Address" placeholder="Clinic Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />

                    </>
                  )}

                  {userType === 'lab' && (
                    <>
                      <InputField icon={MapPin} label="Lab Address" placeholder="City" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                      <div className="space-y-2 group">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Lab Type</label>
                        <div className="relative">
                          <FlaskConical className="absolute top-4 left-4 h-5 w-5 text-gray-400 z-10" />
                          <select
                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#602E5A]/20 focus:border-[#602E5A] font-medium appearance-none"
                            value={formData.labType}
                            onChange={(e) => setFormData({ ...formData, labType: e.target.value })}
                          >
                            <option value="">Select Type</option>
                            <option value="Pathology">Pathology</option>
                            <option value="Radiology">Radiology</option>
                            <option value="Microbiology">Microbiology</option>
                            <option value="Biochemistry">Biochemistry</option>
                            <option value="Multi-specialty">Multi-specialty</option>
                          </select>
                        </div>
                      </div>
                      <TextAreaField icon={FileText} label="Tests Offered" placeholder="List of tests available" value={formData.tests_list} onChange={e => setFormData({ ...formData, tests_list: e.target.value })} />
                      <InputField icon={Truck} label="Report Delivery" placeholder="e.g. Email, Physical" value={formData.report_delivery_method} onChange={e => setFormData({ ...formData, report_delivery_method: e.target.value })} />
                    </>
                  )}

                  <div className="space-y-4 pt-4">
                    <button
                      onClick={() => handleGoogleLogin(userType)}
                      disabled={submitting}
                      className="w-full bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                      Sign in with Google
                    </button>

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full bg-[#602E5A] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-purple-900/20 hover:bg-[#4a2135] transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {submitting ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : 'Complete Registration'}
                    </button>
                  </div>
                </div>
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
    teal: 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200',
    orange: 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200'
  };

  return (
    <button onClick={onClick} className={`w-full p-8 rounded-3xl border transition-all transform hover:-translate-y-1 hover:shadow-xl text-left group relative overflow-hidden ${colors[color] ? colors[color].replace('text-', 'border-') : 'bg-white border-gray-100'}`}>
      <div className={`absolute top-0 right-0 p-32 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 transition-all group-hover:opacity-30 ${color === 'teal' ? 'bg-teal-400' : color === 'blue' ? 'bg-blue-400' : color === 'green' ? 'bg-emerald-400' : 'bg-orange-400'
        }`}></div>

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border ${color === 'teal' ? 'bg-white text-teal-600 border-teal-100' :
        color === 'blue' ? 'bg-white text-blue-600 border-blue-100' :
          color === 'green' ? 'bg-white text-emerald-600 border-emerald-100' :
            'bg-white text-orange-600 border-orange-100'
        }`}>
        <Icon className="w-7 h-7" />
      </div>

      <h3 className={`text-2xl font-black mb-1 ${color === 'teal' ? 'text-teal-900' :
        color === 'blue' ? 'text-blue-900' :
          color === 'green' ? 'text-emerald-900' :
            'text-orange-900'
        }`}>{title}</h3>

      <p className={`font-medium ${color === 'teal' ? 'text-teal-700/70' :
        color === 'blue' ? 'text-blue-700/70' :
          color === 'green' ? 'text-emerald-700/70' :
            'text-orange-700/70'
        }`}>{desc}</p>

      <div className={`absolute bottom-6 right-6 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 ${color === 'teal' ? 'bg-teal-200 text-teal-800' :
        color === 'blue' ? 'bg-blue-200 text-blue-800' :
          color === 'green' ? 'bg-emerald-200 text-emerald-800' :
            'bg-orange-200 text-orange-800'
        }`}>
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
};

const DaySelector = ({ value, onChange }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Parse current value
  let selected = [];
  if (Array.isArray(value)) {
    selected = value;
  } else if (typeof value === 'string' && value) {
    if (value.includes('-')) selected = fullDays; // lazy default for ranges
    else selected = value.split(',').map(d => d.trim());
  }

  const toggleDay = (dayFull) => {
    let newSelected;
    if (selected.includes(dayFull)) {
      newSelected = selected.filter(d => d !== dayFull);
    } else {
      newSelected = [...selected, dayFull];
    }
    // Sort based on week order
    newSelected.sort((a, b) => fullDays.indexOf(a) - fullDays.indexOf(b));
    onChange(newSelected);
  };

  return (
    <div className="space-y-2 group">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Available Days</label>
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
        {fullDays.map((day, i) => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${selected.includes(day)
              ? 'bg-[#602E5A] text-white border-[#602E5A] shadow-md'
              : 'bg-white text-gray-500 border-gray-200 hover:border-[#602E5A]/30'
              }`}
          >
            {days[i]}
          </button>
        ))}
      </div>
    </div>
  );
};

const TimeRangeSelector = ({ value, onChange }) => {
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');

  useEffect(() => {
    if (value && value.includes('-')) {
      try {
        const parts = value.split('-').map(p => p.trim());
        if (parts.length === 2) {
          const to24h = (t12) => {
            const [time, modifier] = t12.split(' ');
            let [h, m] = time.split(':').map(Number);
            if (modifier === 'PM' && h < 12) h += 12;
            if (modifier === 'AM' && h === 12) h = 0;
            return `${h.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
          };
          setStart(to24h(parts[0]));
          setEnd(to24h(parts[1]));
        }
      } catch (e) {
        console.error('Error parsing time range:', e);
      }
    }
  }, [value]);

  const handleTimeChange = (newStart, newEnd) => {
    setStart(newStart);
    setEnd(newEnd);

    // Format to 12h
    const format12 = (time24) => {
      if (!time24) return '';
      const [h, m] = time24.split(':');
      const date = new Date();
      date.setHours(h);
      date.setMinutes(m);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const formatted = `${format12(newStart)} - ${format12(newEnd)}`;
    onChange(formatted);
  };

  return (
    <div className="space-y-2 group">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Timings</label>
      <div className="flex items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
        <div className="flex-1">
          <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Start</label>
          <input
            type="time"
            value={start}
            onChange={e => handleTimeChange(e.target.value, end)}
            className="w-full bg-white border border-gray-200 rounded-xl px-2 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#602E5A]/20"
          />
        </div>
        <span className="text-gray-300 font-bold mt-4">-</span>
        <div className="flex-1">
          <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">End</label>
          <input
            type="time"
            value={end}
            onChange={e => handleTimeChange(start, e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-2 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#602E5A]/20"
          />
        </div>
      </div>
    </div>
  );
};
