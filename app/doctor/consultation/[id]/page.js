'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { supabase } from '@/lib/supabase';
import { Mic, MicOff, Save, Send, FileText, User, Clock, Activity, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConsultationPage({ params }) {
    const router = useRouter();
    // Unwrap params using React.use() if needed in future Next.js versions, 
    // but standard props access works for now in most setups. 
    // However, in Next.js 15+ params is a promise. 
    // To be safe, I'll access it directly as it's likely Next.js 13/14 logic based on 'use client'.
    const { id } = params;

    const [loading, setLoading] = useState(true);
    const [appointment, setAppointment] = useState(null);
    const [prescription, setPrescription] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        loadAppointment();

        // Initialize Speech Recognition
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setPrescription(prev => prev + ' ' + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
        }
    }, [id]);

    const loadAppointment = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*, patients(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setAppointment(data);
        } catch (error) {
            console.error('Error loading appointment:', error);
            toast.error('Could not load appointment details');
        } finally {
            setLoading(false);
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error('Voice recognition not supported in this browser');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
            toast.success('Listening... Speak now');
        }
    };

    const savePrescription = async () => {
        if (!prescription.trim()) {
            toast.error('Prescription cannot be empty');
            return;
        }

        try {
            const { error } = await supabase.from('prescriptions').insert([{
                patient_id: appointment.patient_id,
                doctor_id: appointment.doctor_id,
                appointment_id: appointment.id,
                medications: [], // Assuming simplistic text for now, or you'd parse it
                instructions: prescription,
                diagnosis: "Consultation"
            }]);

            if (error) throw error;

            await supabase.from('appointments').update({ status: 'completed' }).eq('id', id);

            toast.success('Prescription sent to patient!');
            router.push('/doctor/dashboard');
        } catch (error) {
            console.error('Error saving prescription:', error);
            toast.error('Failed to send prescription');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plum-600"></div></div>;
    if (!appointment) return <div className="min-h-screen flex items-center justify-center">Appointment not found</div>;

    return (
        <div className="min-h-screen bg-surface flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Consultation Room</h1>
                        <p className="text-sm text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Session</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="font-bold text-gray-900">{appointment.patients?.name}</p>
                        <p className="text-xs text-gray-500">ID: #{appointment.patients?.id.slice(0, 8)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-plum-100 flex items-center justify-center text-plum-700 font-bold">
                        {appointment.patients?.name?.[0]}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid lg:grid-cols-3 gap-8">

                {/* Left Panel: Patient Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                            <User size={20} className="text-plum-600" /> Patient Vitals
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500 text-sm">Blood Pressure</span>
                                <span className="font-bold text-gray-900">120/80</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500 text-sm">Heart Rate</span>
                                <span className="font-bold text-gray-900">72 bpm</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500 text-sm">Weight</span>
                                <span className="font-bold text-gray-900">70 kg</span>
                            </div>
                            {/* Mock data or fetch real vitals if available */}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-teal-600" /> History
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Patient has a history of mild hypertension. Last visit was 3 months ago. Reports occasional headaches.
                        </p>
                    </div>
                </div>

                {/* Right Panel: Prescription Pad */}
                <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600" /> Prescription Pad
                        </h3>
                        <button
                            onClick={toggleListening}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${isListening ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            {isListening ? <><MicOff size={18} /> Stop Dictation</> : <><Mic size={18} /> Voice Typing</>}
                        </button>
                    </div>

                    <div className="flex-1 p-6">
                        <textarea
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                            placeholder="Start typing or use voice dictation to write prescription..."
                            className="w-full h-full resize-none border-none focus:ring-0 text-lg leading-relaxed text-gray-800 placeholder:text-gray-300 font-medium"
                            style={{ minHeight: '300px' }}
                        />
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                        <p className="text-xs text-gray-400 italic">Auto-saves locally</p>
                        <button
                            onClick={savePrescription}
                            className="flex items-center gap-2 px-8 py-3 bg-plum-700 text-white font-bold rounded-xl hover:bg-plum-800 transition-all shadow-lg shadow-plum-700/20"
                        >
                            <Send size={18} /> Save & Share
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
}
