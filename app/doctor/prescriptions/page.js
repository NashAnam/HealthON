'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getDoctor, supabase } from '@/lib/supabase';
import { FileText, Search, ArrowLeft, Calendar, User, Plus, X, Save, Trash2 } from 'lucide-react';
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
        medications: [{
            name: '',
            dosage_val: '',
            dosage_unit: 'mg',
            frequency: 'OD (Once daily)',
            duration_val: '',
            duration_unit: 'days',
            instructions: 'After food'
        }],
        notes: ''
    });

    const DOSAGE_UNITS = ['mg', 'ml', 'tab', 'cap', 'units', 'tsp', 'tbsp', 'puffs'];
    const FREQUENCIES = [
        'OD (Once daily)',
        'BD (Twice daily)',
        'TDS (Three times daily)',
        'QID (Four times daily)',
        'HS (At bedtime)',
        'SOS (As needed)',
        'AC (Before food)',
        'PC (After food)'
    ];
    const DURATION_UNITS = ['days', 'weeks', 'months'];
    const INSTRUCTIONS_PRESETS = ['After food', 'Before food', 'Empty stomach', 'With water', 'Avoid milk'];

    const addMedication = () => {
        setFormData({
            ...formData,
            medications: [...formData.medications, {
                name: '',
                dosage_val: '',
                dosage_unit: 'mg',
                frequency: 'OD (Once daily)',
                duration_val: '',
                duration_unit: 'days',
                instructions: 'After food'
            }]
        });
    };

    const removeMedication = (index) => {
        setFormData({
            ...formData,
            medications: formData.medications.filter((_, i) => i !== index)
        });
    };

    const updateMedication = (index, field, value) => {
        const newMeds = [...formData.medications];
        newMeds[index][field] = value;
        setFormData({ ...formData, medications: newMeds });
    };

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
        if (!formData.medications[0]?.name) return toast.error('Enter at least one medication');

        const tid = toast.loading('Saving...');
        try {
            const { error } = await supabase
                .from('prescriptions')
                .insert([{
                    doctor_id: doctor.id,
                    patient_id: formData.patient_id,
                    diagnosis: formData.diagnosis,
                    medications: formData.medications.map(m => ({
                        name: m.name,
                        dosage: `${m.dosage_val}${m.dosage_unit}`,
                        frequency: m.frequency,
                        duration: `${m.duration_val} ${m.duration_unit}`,
                        instructions: m.instructions
                    })),
                    notes: formData.notes,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            toast.success('Saved!', { id: tid });
            setShowNewPrescription(false);
            setFormData({
                patient_id: '',
                diagnosis: '',
                medications: [{
                    name: '',
                    dosage_val: '',
                    dosage_unit: 'mg',
                    frequency: 'OD (Once daily)',
                    duration_val: '',
                    duration_unit: 'days',
                    instructions: 'After food'
                }],
                notes: ''
            });
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
                                <div className="space-y-4">
                                    {formData.medications.map((med, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Medicine #{idx + 1}</label>
                                                {formData.medications.length > 1 && (
                                                    <button
                                                        onClick={() => removeMedication(idx)}
                                                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Medicine Name</label>
                                                <input
                                                    placeholder="e.g. Paracetamol"
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-bold"
                                                    value={med.name}
                                                    onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dosage</label>
                                                    <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-teal-500 transition-colors">
                                                        <input
                                                            type="number"
                                                            placeholder="500"
                                                            className="w-3/5 p-3 bg-transparent outline-none text-sm font-bold"
                                                            value={med.dosage_val}
                                                            onChange={(e) => updateMedication(idx, 'dosage_val', e.target.value)}
                                                        />
                                                        <select
                                                            className="w-2/5 p-3 bg-white/50 border-l border-slate-200 outline-none text-[10px] font-black uppercase text-teal-700 cursor-pointer"
                                                            value={med.dosage_unit}
                                                            onChange={(e) => updateMedication(idx, 'dosage_unit', e.target.value)}
                                                        >
                                                            {DOSAGE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Duration</label>
                                                    <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-teal-500 transition-colors">
                                                        <input
                                                            type="number"
                                                            placeholder="7"
                                                            className="w-3/5 p-3 bg-transparent outline-none text-sm font-bold"
                                                            value={med.duration_val}
                                                            onChange={(e) => updateMedication(idx, 'duration_val', e.target.value)}
                                                        />
                                                        <select
                                                            className="w-2/5 p-3 bg-white/50 border-l border-slate-200 outline-none text-[10px] font-black uppercase text-teal-700 cursor-pointer"
                                                            value={med.duration_unit}
                                                            onChange={(e) => updateMedication(idx, 'duration_unit', e.target.value)}
                                                        >
                                                            {DURATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Frequency</label>
                                                <select
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-bold text-xs cursor-pointer"
                                                    value={med.frequency}
                                                    onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                                                >
                                                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Instructions</label>
                                                <select
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-bold text-xs cursor-pointer"
                                                    value={med.instructions}
                                                    onChange={(e) => updateMedication(idx, 'instructions', e.target.value)}
                                                >
                                                    {INSTRUCTIONS_PRESETS.map(i => <option key={i} value={i}>{i}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addMedication}
                                        className="w-full py-3 bg-teal-50 text-teal-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-100 transition-colors border border-teal-200"
                                    >
                                        <Plus size={18} /> Add Another Medicine
                                    </button>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Doctor's Notes / Instructions</label>
                                    <textarea
                                        placeholder="e.g. Take after meal"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 h-20 font-medium text-sm"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                <button
                                    onClick={handleSavePrescription}
                                    className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold mt-4 flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors"
                                >
                                    <Save size={18} /> Save & Send
                                </button>
                            </div>
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
