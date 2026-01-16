'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getDoctor, supabase } from '@/lib/supabase';
import { FileText, Search, ArrowLeft, Calendar, User, Download, ExternalLink, Mic, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrescriptionsPage() {
    const router = useRouter();
    const [doctor, setDoctor] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewPrescription, setShowNewPrescription] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [formData, setFormData] = useState({
        patient_id: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        instructions: ''
    });

    useEffect(() => {
        loadPrescriptions();
    }, []);

    useEffect(() => {
        filterPrescriptions();
    }, [prescriptions, searchTerm]);

    const loadPrescriptions = async () => {
        const user = await getCurrentUser();
        if (!user) return router.push('/login');

        const { data: doctorData } = await getDoctor(user.id);
        if (!doctorData) return router.push('/complete-profile');
        setDoctor(doctorData);

        // Fetch prescriptions (Assuming 'prescriptions' table exists and links to doctor)
        // Adjust query based on actual schema: likely prescriptions have doctor_id
        const { data, error } = await supabase
            .from('prescriptions')
            .select(`
                *,
                patients:patient_id (name, phone, email)
            `)
            .eq('doctor_id', doctorData.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading prescriptions:', error);
            toast.error('Failed to load prescriptions');
        } else {
            setPrescriptions(data || []);
        }
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

    const startVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error('Voice input not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            toast.success('Listening...');
        };

        recognition.onresult = (event) => {
            const text = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            setTranscript(text);
            setFormData(prev => ({ ...prev, instructions: text }));
        };

        recognition.onerror = (event) => {
            setIsListening(false);
            toast.error('Voice input error');
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleSavePrescription = async () => {
        if (!formData.patient_id || !formData.medication_name) {
            toast.error('Please fill required fields');
            return;
        }

        try {
            const { error } = await supabase
                .from('prescriptions')
                .insert([{
                    doctor_id: doctor.id,
                    patient_id: formData.patient_id,
                    medication_name: formData.medication_name,
                    dosage: formData.dosage,
                    frequency: formData.frequency,
                    start_date: formData.start_date,
                    end_date: formData.end_date || null,
                    instructions: formData.instructions,
                    voice_transcription: transcript || null
                }]);

            if (error) throw error;

            toast.success('Prescription saved!');
            setShowNewPrescription(false);
            setFormData({
                patient_id: '',
                medication_name: '',
                dosage: '',
                frequency: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                instructions: ''
            });
            setTranscript('');
            loadPrescriptions();
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save prescription');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
            <header className="bg-white shadow-sm border-b border-rose-100">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/doctor/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
                            <p className="text-sm text-gray-600">Archive of issued prescriptions</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Search */}
                <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-rose-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by patient name or diagnosis..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* New Prescription Button */}
                <button
                    onClick={() => setShowNewPrescription(!showNewPrescription)}
                    className="mb-6 bg-[#5D2A42] hover:bg-[#4a2135] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    New Prescription
                </button>

                {/* New Prescription Form */}
                {showNewPrescription && (
                    <div className="bg-white border-2 border-[#648C81]/20 rounded-3xl p-6 mb-8">
                        <h2 className="text-xl font-black text-slate-900 mb-6">Create Prescription</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Patient ID</label>
                                <input
                                    type="text"
                                    value={formData.patient_id}
                                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                                    placeholder="Patient UUID"
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-[#5D2A42] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Medication Name</label>
                                <input
                                    type="text"
                                    value={formData.medication_name}
                                    onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                                    placeholder="e.g., Metformin"
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-[#5D2A42] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Dosage</label>
                                <input
                                    type="text"
                                    value={formData.dosage}
                                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                    placeholder="e.g., 500mg"
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-[#5D2A42] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Frequency</label>
                                <input
                                    type="text"
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    placeholder="e.g., Twice daily"
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-[#5D2A42] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-[#5D2A42] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">End Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-[#5D2A42] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Instructions</label>
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={startVoiceInput}
                                    disabled={isListening}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isListening
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-[#648C81]/10 text-[#648C81] hover:bg-[#648C81]/20'
                                        }`}
                                >
                                    <Mic className="w-4 h-4" />
                                    {isListening ? 'Listening...' : 'Voice Input'}
                                </button>
                            </div>
                            <textarea
                                value={formData.instructions}
                                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                placeholder="Add prescription instructions..."
                                rows={4}
                                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-[#5D2A42] focus:outline-none resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSavePrescription}
                                className="flex-1 bg-[#5D2A42] hover:bg-[#4a2135] text-white p-3 rounded-xl font-bold transition-all"
                            >
                                Save Prescription
                            </button>
                            <button
                                onClick={() => setShowNewPrescription(false)}
                                className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 p-3 rounded-xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {filteredPrescriptions.length === 0 ? (
                        <div className="text-center py-20">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No prescriptions found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredPrescriptions.map((prescription) => (
                                <div key={prescription.id} className="p-6 hover:bg-rose-50/30 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{prescription.patients?.name || 'Unknown Patient'}</h3>
                                                <p className="text-sm text-gray-600 mb-2">Diagnosis: {prescription.diagnosis}</p>
                                                <div className="flex flex-col gap-2 mt-2">
                                                    {prescription.medications?.map((med, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                                            <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                                            <span className="font-bold">{med.name}</span>
                                                            <span className="text-gray-400">|</span>
                                                            <span>{med.dosage}</span>
                                                            <span className="text-gray-400">|</span>
                                                            <span className="text-gray-500 italic">{med.frequency}</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="text-gray-500 text-xs">{med.duration}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2 justify-end">
                                                <Calendar size={14} />
                                                <span>{formatDate(prescription.created_at)}</span>
                                            </div>
                                            {/* Action placeholder */}
                                            {/* <button className="text-rose-600 text-sm font-semibold hover:underline">View PDF</button> */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
