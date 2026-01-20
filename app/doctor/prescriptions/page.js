'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getDoctor, supabase } from '@/lib/supabase';
import { FileText, Search, ArrowLeft, Calendar, User, Plus, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrescriptionsPage() {
    const router = useRouter();
    const [doctor, setDoctor] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewPrescription, setShowNewPrescription] = useState(false);

    // Form Data
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState({
        patient_id: '',
        diagnosis: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        notes: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        filterPrescriptions();
    }, [prescriptions, searchTerm]);

    const loadInitialData = async () => {
        const user = await getCurrentUser();
        if (!user) return router.push('/login');

        const { data: doctorData } = await getDoctor(user.id);
        if (!doctorData) return router.push('/complete-profile');
        setDoctor(doctorData);

        // Load Prescriptions
        const { data: rxData } = await supabase
            .from('prescriptions')
            .select(`*, patients:patient_id (name, phone)`)
            .eq('doctor_id', doctorData.id)
            .order('created_at', { ascending: false });

        setPrescriptions(rxData || []);

        // Load Patients for the dropdown
        const { data: pts } = await supabase.from('patients').select('id, name');
        setPatients(pts || []);
    };

    const filterPrescriptions = () => {
        const filtered = prescriptions.filter(p =>
            p.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPrescriptions(filtered);
    };

    const handleSavePrescription = async () => {
        if (!formData.patient_id) return toast.error('Select a patient');
        if (!formData.diagnosis) return toast.error('Enter diagnosis');
        if (!formData.medication_name) return toast.error('Enter medication');

        const tid = toast.loading('Saving...');
        try {
            const { error } = await supabase
                .from('prescriptions')
                .insert([{
                    doctor_id: doctor.id,
                    patient_id: formData.patient_id,
                    diagnosis: formData.diagnosis,
                    medication_name: formData.medication_name,
                    dosage: formData.dosage,
                    frequency: formData.frequency,
                    notes: formData.notes,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            toast.success('Saved!', { id: tid });
            setShowNewPrescription(false);
            setFormData({ patient_id: '', diagnosis: '', medication_name: '', dosage: '', frequency: '', notes: '' });
            loadInitialData();
        } catch (error) {
            toast.error('Error: ' + error.message, { id: tid });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold">Prescriptions</h1>
                    </div>
                    <button
                        onClick={() => setShowNewPrescription(true)}
                        className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                    >
                        <Plus size={18} /> New
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by patient or diagnosis..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-6 py-3 outline-none focus:ring-2 focus:ring-teal-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {showNewPrescription && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewPrescription(false)} />
                        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 p-6 flex flex-col gap-4">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-bold">New Prescription</h2>
                                <button onClick={() => setShowNewPrescription(false)}><X /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Patient</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        value={formData.patient_id}
                                        onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                                    >
                                        <option value="">Select Patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Diagnosis</label>
                                    <input
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        value={formData.diagnosis}
                                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Medicine</label>
                                        <input
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                            value={formData.medication_name}
                                            onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dosage</label>
                                        <input
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                            value={formData.dosage}
                                            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Frequency</label>
                                        <input
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                            value={formData.frequency}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Notes</label>
                                    <textarea
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-20"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSavePrescription}
                                className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold mt-4 flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Save & Send
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {filteredPrescriptions.map(rx => (
                        <div key={rx.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{rx.patients?.name}</h3>
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">{new Date(rx.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-1 rounded-md font-bold uppercase tracking-widest">Active</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Diagnosis</p>
                                    <p className="text-sm font-medium">{rx.diagnosis}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Prescription</p>
                                    <p className="text-sm font-bold text-teal-700">
                                        {rx.medication_name || (rx.medications && rx.medications[0]?.name)}
                                        <span className="text-slate-400 ml-2 font-medium">{rx.dosage || (rx.medications && rx.medications[0]?.dosage)}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredPrescriptions.length === 0 && (
                        <div className="text-center py-12 text-slate-400">No records found</div>
                    )}
                </div>
            </main>
        </div>
    );
}
