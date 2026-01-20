'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getDoctor, supabase } from '@/lib/supabase';
import { FileText, Search, ArrowLeft, Calendar, User, Download, ExternalLink, Mic, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrescriptionsPage() {
    const router = useRouter();
    const [doctor, setDoctor] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewPrescription, setShowNewPrescription] = useState(false);

    // Patient Search
    const [patients, setPatients] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientResults, setShowPatientResults] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    // Form Data
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [medications, setMedications] = useState([
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);

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
            .select(`*, patients:patient_id (name, phone, email)`)
            .eq('doctor_id', doctorData.id)
            .order('created_at', { ascending: false });

        setPrescriptions(rxData || []);

        // Load Patients for search
        const { data: pts } = await supabase.from('patients').select('id, name, phone');
        setPatients(pts || []);
    };

    const filterPrescriptions = () => {
        if (!searchTerm) {
            setFilteredPrescriptions(prescriptions);
            return;
        }
        const filtered = prescriptions.filter(p =>
            p.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPrescriptions(filtered);
    };

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const removeMedication = (index) => {
        if (medications.length > 1) {
            setMedications(medications.filter((_, i) => i !== index));
        }
    };

    const handleMedChange = (index, field, value) => {
        const newMeds = [...medications];
        newMeds[index][field] = value;
        setMedications(newMeds);
    };

    const handleSavePrescription = async () => {
        if (!selectedPatient) return toast.error('Please select a patient');
        if (!diagnosis) return toast.error('Please enter a diagnosis');
        if (medications.some(m => !m.name)) return toast.error('Please enter medication names');

        const tid = toast.loading('Saving prescription...');
        try {
            const { error } = await supabase
                .from('prescriptions')
                .insert([{
                    doctor_id: doctor.id,
                    patient_id: selectedPatient.id,
                    diagnosis,
                    medications,
                    notes,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            toast.success('Prescription shared with patient!', { id: tid });
            setShowNewPrescription(false);
            resetForm();
            loadInitialData();
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save: ' + error.message, { id: tid });
        }
    };

    const resetForm = () => {
        setSelectedPatient(null);
        setPatientSearch('');
        setDiagnosis('');
        setNotes('');
        setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const filteredPatients = patients.filter(p =>
        p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.phone?.includes(patientSearch)
    ).slice(0, 5);

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-20">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-6 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/doctor/dashboard')} className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
                            <ArrowLeft className="w-6 h-6 text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Prescriptions</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Clinical Documentation</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Search & Actions */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search prescriptions by patient or diagnosis..."
                            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-plum-500/20 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowNewPrescription(true)}
                        className="bg-plum-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-plum-800/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> New Prescription
                    </button>
                </div>

                {/* New Prescription Form Modal */}
                {showNewPrescription && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewPrescription(false)} />
                        <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Generate Prescription</h2>
                                    <p className="text-[10px] font-black text-[#648C81] uppercase tracking-[0.2em] mt-1">Digital Health Record</p>
                                </div>
                                <button onClick={() => setShowNewPrescription(false)} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-rose-500 transition-colors shadow-sm">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {/* Patient Selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-teal-500 rounded-full" />
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select Patient</h3>
                                    </div>

                                    {selectedPatient ? (
                                        <div className="flex items-center justify-between bg-teal-50/50 p-6 rounded-[2rem] border-2 border-teal-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                                                    {selectedPatient.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg uppercase">{selectedPatient.name}</p>
                                                    <p className="text-xs font-bold text-teal-700">{selectedPatient.phone}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setSelectedPatient(null)} className="text-teal-700 font-black text-[10px] uppercase hover:underline">Change Patient</button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or phone..."
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                                                value={patientSearch}
                                                onChange={(e) => {
                                                    setPatientSearch(e.target.value);
                                                    setShowPatientResults(true);
                                                }}
                                                onFocus={() => setShowPatientResults(true)}
                                            />
                                            {showPatientResults && patientSearch && (
                                                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
                                                    {filteredPatients.length > 0 ? filteredPatients.map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => {
                                                                setSelectedPatient(p);
                                                                setShowPatientResults(false);
                                                            }}
                                                            className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-50 text-left"
                                                        >
                                                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-600">{p.name[0]}</div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{p.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{p.phone}</p>
                                                            </div>
                                                        </button>
                                                    )) : (
                                                        <div className="p-6 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">No patients found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-plum-500 rounded-full" />
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Diagnosis</h3>
                                        </div>
                                        <textarea
                                            placeholder="Enter clinical diagnosis..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-plum-500/20 transition-all outline-none h-32 resize-none"
                                            value={diagnosis}
                                            onChange={(e) => setDiagnosis(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Additional Notes</h3>
                                        </div>
                                        <textarea
                                            placeholder="Advice, follow-up or general notes..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all outline-none h-32 resize-none"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Medications */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Medications</h3>
                                        </div>
                                        <button onClick={addMedication} className="text-[10px] font-black text-plum-800 bg-plum-50 px-4 py-2 rounded-xl hover:bg-plum-100 transition-all uppercase tracking-widest flex items-center gap-2">
                                            <Plus size={14} /> Add Medicine
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {medications.map((med, idx) => (
                                            <div key={idx} className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 relative group">
                                                {medications.length > 1 && (
                                                    <button onClick={() => removeMedication(idx)} className="absolute top-4 right-4 p-2 bg-white text-rose-500 rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="lg:col-span-2">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-2">Medicine Name</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., Metformin 500mg"
                                                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                                                            value={med.name}
                                                            onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-2">Dosage</label>
                                                        <input
                                                            type="text"
                                                            placeholder="1 tab"
                                                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                                                            value={med.dosage}
                                                            onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-2">Frequency</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Twice daily"
                                                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                                                            value={med.frequency}
                                                            onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-2">Duration</label>
                                                        <input
                                                            type="text"
                                                            placeholder="7 days"
                                                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                                                            value={med.duration}
                                                            onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="lg:col-span-3">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-2">Instructions</label>
                                                        <input
                                                            type="text"
                                                            placeholder="After breakfast and dinner"
                                                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                                                            value={med.instructions}
                                                            onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                                <button
                                    onClick={handleSavePrescription}
                                    className="flex-1 py-5 bg-plum-800 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-plum-800/20 hover:scale-[1.01] active:scale-95 transition-all"
                                >
                                    Confirm & Share Prescription
                                </button>
                                <button onClick={() => setShowNewPrescription(false)} className="px-10 py-5 bg-white border-2 border-gray-100 text-gray-400 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all">
                                    Discard
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Prescriptions List */}
                <div className="space-y-6">
                    {filteredPrescriptions.length > 0 ? filteredPrescriptions.map((rx) => (
                        <div key={rx.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-plum-100 transition-all group">
                            <div className="flex flex-col lg:flex-row justify-between gap-8">
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-start gap-5">
                                        <div className="w-16 h-16 bg-plum-50 rounded-[1.5rem] flex items-center justify-center text-plum-800 group-hover:scale-110 transition-transform">
                                            <FileText size={32} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase">{rx.patients?.name || 'Unknown Patient'}</h4>
                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Shared</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-400">{rx.patients?.phone || 'No contact info'}</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Diagnosis</p>
                                            <p className="text-sm font-bold text-slate-800 leading-relaxed border-l-4 border-plum-100 pl-4">{rx.diagnosis || 'No diagnosis recorded'}</p>
                                        </div>
                                        {rx.notes && (
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Clinical Notes</p>
                                                <p className="text-sm font-medium text-gray-500 italic leading-relaxed">"{rx.notes}"</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Prescribed Medications</p>
                                        <div className="flex flex-wrap gap-2">
                                            {rx.medications ? rx.medications.map((med, i) => (
                                                <div key={i} className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{med.name}</span>
                                                    <span className="text-[10px] font-bold text-gray-400">{med.dosage} • {med.frequency}</span>
                                                </div>
                                            )) : (
                                                <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{rx.medication_name}</span>
                                                    <span className="text-[10px] font-bold text-gray-400">{rx.dosage} • {rx.frequency}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:w-48 flex flex-col justify-between items-end border-l border-gray-50 pl-8">
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1 justify-end">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Date Issued</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900">{new Date(rx.created_at).toLocaleDateString('en-US')}</p>
                                    </div>
                                    <button onClick={() => toast.success('Downloading report...')} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-plum-50 hover:text-plum-800 transition-all shadow-sm">
                                        Print / PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                            <FileText className="w-20 h-20 text-gray-100 mx-auto mb-6" />
                            <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">No clinical records available</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
