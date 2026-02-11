'use client';
import { useState } from 'react';
import { X, FileText, Plus, Trash2, Calendar, Clock, Video, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrescriptionModal({ isOpen, onClose, appointment, patient, doctor }) {
    const [activeTab, setActiveTab] = useState('prescription');
    const [diagnosis, setDiagnosis] = useState('');
    const [medications, setMedications] = useState([
        { name: '', dosage_val: '500', dosage_unit: 'mg', frequency: 'OD (Once daily)', duration_val: '7', duration_unit: 'days', instructions: 'After food' }
    ]);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
    const INSTRUCTIONS_PRESETS = [
        'After food',
        'Before food',
        'Empty stomach',
        'With water',
        'Avoid milk',
        'Dissolve in water'
    ];

    const addMedication = () => {
        setMedications([...medications, {
            name: '',
            dosage_val: '',
            dosage_unit: 'mg',
            frequency: 'OD (Once daily)',
            duration_val: '',
            duration_unit: 'days',
            instructions: 'After food'
        }]);
    };

    const removeMedication = (index) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const updateMedication = (index, field, value) => {
        const newMeds = [...medications];
        newMeds[index][field] = value;
        setMedications(newMeds);
    };

    const handleSubmit = async () => {
        // Validation handling
        if (!diagnosis && activeTab === 'consultation') {
            toast.error('Please enter diagnosis');
            return;
        }

        setSubmitting(true);
        try {
            const prescriptionData = {
                patient_id: patient?.id,
                doctor_id: doctor?.id,
                appointment_id: appointment?.id,
                diagnosis: diagnosis || 'General Consultation',
                medications: medications.map(m => ({
                    name: m.name,
                    dosage: `${m.dosage_val}${m.dosage_unit}`,
                    frequency: m.frequency,
                    duration: `${m.duration_val} ${m.duration_unit}`,
                    instructions: m.instructions
                })),
                notes: notes,
                created_at: new Date().toISOString()
            };

            console.log('💊 Creating Prescription:', {
                payload: prescriptionData,
                patient: patient,
                doctor: doctor
            });

            const { data: insertedData, error } = await supabase.from('prescriptions').insert([prescriptionData]).select();

            if (error) throw error;

            console.log('✅ Prescription created:', insertedData);

            if (appointment?.id) {
                await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointment.id);
            }

            toast.success('Prescription shared successfully!');
            onClose();
        } catch (error) {
            console.error('Error creating prescription:', error);
            toast.error(`Failed: ${error.message || 'Database error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-0 md:p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white/95 backdrop-blur-xl w-full h-full max-w-7xl md:h-[90vh] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
                >
                    {/* Header */}
                    <div className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-plum-800 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-plum-50">
                                {patient?.name?.[0] || 'P'}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 leading-tight">Patient Consultation</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{patient?.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                        {/* Sidebar */}
                        <aside className="hidden md:block w-80 bg-white border-r border-gray-100 p-8 overflow-y-auto space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Details</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Age</span>
                                        <span className="text-sm font-bold text-gray-900">{patient?.age || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Gender</span>
                                        <span className="text-sm font-bold text-gray-900">{patient?.gender || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Status</span>
                                        <span className="text-sm font-bold text-teal-600">Active</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-plum-50 rounded-[1.5rem] p-6 border border-plum-100">
                                <h3 className="text-xs font-black text-plum-800 uppercase tracking-widest mb-2">Note</h3>
                                <p className="text-[10px] text-plum-700 leading-relaxed font-bold">
                                    Ensure all required fields are filled before issuing the prescription. This document is legally binding.
                                </p>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 flex flex-col bg-[#F8FAFB] overflow-hidden">
                            <div className="px-4 md:px-8 pt-6 md:pt-8 shrink-0">
                                <div className="bg-gray-100 p-1.5 rounded-[1.5rem] flex flex-wrap md:flex-nowrap gap-1.5 border border-gray-200/50 shadow-inner w-fit">
                                    {['Consultation', 'Prescription', 'History'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab.toLowerCase())}
                                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.toLowerCase()
                                                ? 'bg-white text-plum-800 shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-6">
                                {activeTab === 'consultation' && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Diagnosis / Clinical Notes</h4>
                                            <textarea
                                                className="w-full h-64 bg-gray-50 rounded-2xl p-6 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-plum-500/20 text-gray-700 font-medium resize-none transition-all placeholder:text-gray-300"
                                                placeholder="Enter clinical findings and diagnosis details here..."
                                                value={diagnosis}
                                                onChange={(e) => setDiagnosis(e.target.value)}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'prescription' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
                                            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Write Prescription</h4>
                                                <button onClick={addMedication} className="p-2 bg-plum-50 text-plum-600 rounded-xl hover:bg-plum-100 transition-colors shadow-sm border border-plum-100">
                                                    <Plus size={18} />
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                {medications.map((med, idx) => (
                                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50/50 p-5 rounded-[1.5rem] border border-gray-100 hover:border-plum-200 transition-colors group">
                                                        <div className="md:col-span-3">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Medication</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Name"
                                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20"
                                                                value={med.name}
                                                                onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Dosage</label>
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    placeholder="500"
                                                                    className="flex-[3] min-w-0 bg-white border border-gray-200 rounded-xl px-2 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20"
                                                                    value={med.dosage_val}
                                                                    onChange={(e) => updateMedication(idx, 'dosage_val', e.target.value)}
                                                                />
                                                                <select
                                                                    className="flex-[2] min-w-0 bg-white border border-gray-200 rounded-xl px-1 py-3 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20 cursor-pointer"
                                                                    value={med.dosage_unit}
                                                                    onChange={(e) => updateMedication(idx, 'dosage_unit', e.target.value)}
                                                                >
                                                                    {DOSAGE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="md:col-span-3">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Frequency</label>
                                                            <select
                                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20 cursor-pointer"
                                                                value={med.frequency}
                                                                onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                                                            >
                                                                {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Duration</label>
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    placeholder="7"
                                                                    className="flex-[3] min-w-0 bg-white border border-gray-200 rounded-xl px-2 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20"
                                                                    value={med.duration_val}
                                                                    onChange={(e) => updateMedication(idx, 'duration_val', e.target.value)}
                                                                />
                                                                <select
                                                                    className="flex-[2] min-w-0 bg-white border border-gray-200 rounded-xl px-1 py-3 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20 cursor-pointer"
                                                                    value={med.duration_unit}
                                                                    onChange={(e) => updateMedication(idx, 'duration_unit', e.target.value)}
                                                                >
                                                                    {DURATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="md:col-span-1 hidden md:flex items-center justify-center pb-3">
                                                            {medications.length > 1 && (
                                                                <button onClick={() => removeMedication(idx)} className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="md:col-span-12">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Instructions</label>
                                                            <div className="flex gap-2">
                                                                <select
                                                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20 cursor-pointer"
                                                                    value={med.instructions}
                                                                    onChange={(e) => updateMedication(idx, 'instructions', e.target.value)}
                                                                >
                                                                    {INSTRUCTIONS_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                                                                </select>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Or type custom instructions..."
                                                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-500/20"
                                                                    value={med.instructions}
                                                                    onChange={(e) => updateMedication(idx, 'instructions', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-8">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Additional Instructions</label>
                                                <textarea
                                                    className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-plum-500/20 resize-none"
                                                    placeholder="Other notes..."
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'history' && (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                        <Clock size={48} className="text-gray-300 mb-4" />
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No previous history found</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-8 border-t border-gray-100 flex justify-end gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] relative z-10">
                                <button onClick={onClose} className="px-8 py-4 bg-gray-50 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100">
                                    Close
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-10 py-4 bg-plum-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-plum-900 transition-all shadow-xl shadow-plum-800/20 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {submitting ? 'Sending...' : <><Check size={16} /> Issue Prescription</>}
                                </button>
                            </div>
                        </main>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
