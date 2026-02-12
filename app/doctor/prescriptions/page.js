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
    const [selectedPrescription, setSelectedPrescription] = useState(null);

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

    const handleDeletePrescription = async (rxId) => {
        if (!confirm('Are you sure you want to delete this prescription? This will also remove the associated medication reminders for the patient.')) return;

        const tid = toast.loading('Deleting...');
        try {
            // 1. Delete the prescription
            // We include the doctor_id filter to ensure the current doctor can only affect their own records
            const { error: rxError, count } = await supabase
                .from('prescriptions')
                .delete({ count: 'exact' })
                .eq('id', rxId)
                .eq('doctor_id', doctor.id);

            if (rxError) throw rxError;

            // If count is 0, it means either the record is gone or RLS blocked the deletion
            if (count === 0) {
                const { data: exists } = await supabase.from('prescriptions').select('id').eq('id', rxId).maybeSingle();
                if (exists) {
                    throw new Error('Database Permission Denied: You do not have permission to delete this record. Please run the SQL fix provided in the implementation plan.');
                }
            }

            // 2. Delete associated reminders
            await supabase
                .from('reminders')
                .delete()
                .ilike('description', `%[Ref-RX:${rxId}]%`);

            toast.success('Prescription deleted successfully!', { id: tid });
            setSelectedPrescription(null);

            // Optimistic update
            setPrescriptions(prev => prev.filter(p => p.id !== rxId));
            loadInitialData();
        } catch (err) {
            console.error('Delete Error:', err);
            toast.error(err.message || 'Failed to delete. Check your database permissions.', { id: tid });
        }
    };

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

        // Load Patients for the dropdown (All connected patients)
        const { data: apts } = await supabase
            .from('appointments')
            .select('patient_id, patients(id, name)')
            .eq('doctor_id', doctorData.id);

        // Deduplicate patients
        const uniquePatients = [];
        const seenIds = new Set();
        (apts || []).forEach(apt => {
            if (apt.patients && !seenIds.has(apt.patients.id)) {
                seenIds.add(apt.patients.id);
                uniquePatients.push(apt.patients);
            }
        });

        setPatients(uniquePatients);
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
            const { data: newRx, error } = await supabase
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
                }])
                .select()
                .single();

            if (error) throw error;

            // Automatically create medication reminders for the patient
            try {
                const frequencyToTimes = {
                    'OD (Once daily)': ['08:00'],
                    'BD (Twice daily)': ['08:00', '20:00'],
                    'TDS (Three times daily)': ['08:00', '14:00', '20:00'],
                    'QID (Four times daily)': ['08:00', '12:00', '16:00', '20:00'],
                    'HS (At bedtime)': ['22:00'],
                    'AC (Before food)': ['07:30'],
                    'PC (After food)': ['08:30'],
                    'SOS (As needed)': [] // No recurring reminder
                };

                const today = new Date().toISOString().split('T')[0];
                const reminderEntries = [];
                formData.medications.forEach(med => {
                    const times = frequencyToTimes[med.frequency] || ['09:00'];
                    times.forEach(time => {
                        reminderEntries.push({
                            patient_id: formData.patient_id,
                            title: `Take ${med.name}`,
                            description: `${med.dosage} (${med.frequency}) - ${med.instructions}`,
                            reminder_type: 'medication',
                            reminder_time: `${today}T${time}:00`,
                            frequency: 'daily',
                            is_active: true,
                            created_at: new Date().toISOString()
                        });
                    });
                });

                if (reminderEntries.length > 0) {
                    await supabase.from('reminders').insert(reminderEntries.map(r => ({
                        ...r,
                        description: `${r.description} [Ref-RX:${newRx.id}]`
                    })));
                }
            } catch (remErr) {
                console.error('Error auto-creating reminders:', remErr);
            }

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
            <header className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-40 pt-safe px-safe min-h-[env(safe-area-inset-top)+56px]">
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewPrescription(false)} />
                        <div className="bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-2xl shadow-2xl relative z-10 flex flex-col md:max-h-[90vh] overflow-hidden pb-safe">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                                <h2 className="text-lg font-black text-[#4a2b3d] uppercase tracking-tight">New Prescription</h2>
                                <button onClick={() => setShowNewPrescription(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
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
                                                            type="text"
                                                            inputMode="decimal"
                                                            placeholder="500"
                                                            className="flex-[3] min-w-0 p-3 bg-transparent outline-none text-sm font-bold"
                                                            value={med.dosage_val}
                                                            onChange={(e) => updateMedication(idx, 'dosage_val', e.target.value)}
                                                        />
                                                        <select
                                                            className="flex-[2] min-w-0 p-3 bg-white/50 border-l border-slate-200 outline-none text-[10px] font-black uppercase text-teal-700 cursor-pointer"
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
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="7"
                                                            className="flex-[3] min-w-0 p-3 bg-transparent outline-none text-sm font-bold"
                                                            value={med.duration_val}
                                                            onChange={(e) => updateMedication(idx, 'duration_val', e.target.value)}
                                                        />
                                                        <select
                                                            className="flex-[2] min-w-0 p-3 bg-white/50 border-l border-slate-200 outline-none text-[10px] font-black uppercase text-teal-700 cursor-pointer"
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
                )
                }

                <div className="space-y-4">
                    {filteredPrescriptions.map(rx => (
                        <div
                            key={rx.id}
                            onClick={() => setSelectedPrescription(rx)}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg group-hover:text-teal-700 transition-colors uppercase tracking-tight">{rx.patients?.name}</h3>
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">{new Date(rx.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-1 rounded-md font-bold uppercase tracking-widest">Active</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Diagnosis</p>
                                    <p className="text-sm font-bold text-slate-700">{rx.diagnosis}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prescription</p>
                                    <p className="text-sm font-bold text-teal-700">
                                        {rx.medication_name || (rx.medications && rx.medications[0]?.name)}
                                        <span className="text-slate-400 ml-2 font-medium">{rx.dosage || (rx.medications && rx.medications[0]?.dosage)}</span>
                                        {rx.medications && rx.medications.length > 1 && (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-2">+{rx.medications.length - 1} more</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredPrescriptions.length === 0 && (
                        <div className="text-center py-12 text-slate-400">No records found</div>
                    )}
                </div>

                {/* View Prescription Modal */}
                {
                    selectedPrescription && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedPrescription(null)} />
                            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                                    <div>
                                        <h2 className="text-lg font-black text-[#4a2b3d] uppercase tracking-tight">Prescription Details</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            Date: {new Date(selectedPrescription.created_at).toLocaleDateString('en-GB')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDeletePrescription(selectedPrescription.id)}
                                            className="p-2 hover:bg-rose-50 rounded-full transition-all text-rose-500 group/del"
                                            title="Delete Prescription"
                                        >
                                            <Trash2 size={20} className="group-hover/del:scale-110" />
                                        </button>
                                        <button onClick={() => setSelectedPrescription(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                                    {/* Patient Info */}
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center font-black text-xl">
                                                {selectedPrescription.patients?.name?.[0] || 'P'}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 uppercase tracking-tight">{selectedPrescription.patients?.name}</h3>
                                                <p className="text-xs font-bold text-slate-500">{selectedPrescription.patients?.phone || 'No phone provided'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnosis</p>
                                            <p className="text-sm font-bold text-slate-800">{selectedPrescription.diagnosis}</p>
                                        </div>
                                    </div>

                                    {/* Medications */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medications</h4>
                                        {(selectedPrescription.medications || []).map((med, idx) => (
                                            <div key={idx} className="bg-white border-2 border-slate-100 rounded-2xl p-5 hover:border-teal-100 transition-colors">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h5 className="font-black text-slate-900 uppercase text-sm tracking-tight">{med.name}</h5>
                                                    <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-1 rounded-lg font-black uppercase tracking-widest">
                                                        {med.frequency}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-slate-50 p-3 rounded-xl">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dosage</p>
                                                        <p className="text-xs font-black text-slate-700">{med.dosage}</p>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-xl">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Duration</p>
                                                        <p className="text-xs font-black text-slate-700">{med.duration}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center gap-2 text-slate-500">
                                                    <FileText size={14} className="text-teal-600" />
                                                    <p className="text-xs font-bold italic">{med.instructions}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Notes */}
                                    {selectedPrescription.notes && (
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Doctor's Notes</h4>
                                            <div className="bg-plum-50/50 border border-plum-100 rounded-2xl p-5">
                                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{selectedPrescription.notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-slate-100 shrink-0">
                                    <button
                                        onClick={() => setSelectedPrescription(null)}
                                        className="w-full py-4 bg-[#4a2b3d] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
