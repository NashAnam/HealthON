'use client';
import { useState } from 'react';
import { X, FileText, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function PrescriptionModal({ isOpen, onClose, appointment, patient, doctor }) {
    const [formData, setFormData] = useState({
        diagnosis: '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        labTests: [],
        followUpDate: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const addMedication = () => {
        setFormData({
            ...formData,
            medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
        });
    };

    const removeMedication = (index) => {
        const newMeds = formData.medications.filter((_, i) => i !== index);
        setFormData({ ...formData, medications: newMeds });
    };

    const updateMedication = (index, field, value) => {
        const newMeds = [...formData.medications];
        newMeds[index][field] = value;
        setFormData({ ...formData, medications: newMeds });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.diagnosis) {
            toast.error('Please enter diagnosis');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('prescriptions').insert([{
                patient_id: patient.id,
                doctor_id: doctor.id,
                appointment_id: appointment?.id,
                diagnosis: formData.diagnosis,
                medications: formData.medications,
                lab_tests: formData.labTests,
                follow_up_date: formData.followUpDate || null,
                notes: formData.notes
            }]);

            if (error) throw error;

            toast.success('Prescription created successfully!');
            onClose();
        } catch (error) {
            console.error('Error creating prescription:', error);
            toast.error('Failed to create prescription');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl my-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Create Prescription</h2>
                            <p className="text-sm text-slate-500">For {patient?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Diagnosis */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Diagnosis *</label>
                        <textarea
                            value={formData.diagnosis}
                            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                            placeholder="Enter diagnosis..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {/* Medications */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-slate-700">Medications</label>
                            <button
                                type="button"
                                onClick={addMedication}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"
                            >
                                <Plus className="w-4 h-4" />
                                Add Medicine
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.medications.map((med, index) => (
                                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-sm font-bold text-slate-700">Medicine #{index + 1}</span>
                                        {formData.medications.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMedication(index)}
                                                className="text-rose-600 hover:bg-rose-50 p-1 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Medicine name"
                                            value={med.name}
                                            onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Dosage (e.g., 500mg)"
                                            value={med.dosage}
                                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Frequency (e.g., Twice daily)"
                                            value={med.frequency}
                                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Duration (e.g., 7 days)"
                                            value={med.duration}
                                            onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Instructions (e.g., After meals)"
                                            value={med.instructions}
                                            onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                            className="col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Follow-up Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Follow-up Date</label>
                            <input
                                type="date"
                                value={formData.followUpDate}
                                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Additional Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any additional instructions or notes..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Prescription'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
