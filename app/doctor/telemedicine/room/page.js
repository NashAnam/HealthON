'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Video, VideoOff, Mic, MicOff, PhoneOff, User, MessageSquare, Settings, Share2, Maximize2, FileText, Plus, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import TelemedicineChat from '@/components/TelemedicineChat';
import PrescriptionModal from '@/components/PrescriptionModal';

export default function DoctorTelemedicineCallPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Preparing MD Suite...</p>
            </div>
        }>
            <DoctorRoomContent />
        </Suspense>
    );
}

function DoctorRoomContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();
    const [appointment, setAppointment] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isJoined, setIsJoined] = useState(false);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showEHRModal, setShowEHRModal] = useState(false);
    const [internalNotes, setInternalNotes] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const signalingChannel = useRef(null);
    const pendingCandidates = useRef([]);
    const processedMessages = useRef(new Set());

    useEffect(() => {
        loadAppointment();
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnection.current) {
                peerConnection.current.close();
            }
            if (signalingChannel.current) {
                supabase.removeChannel(signalingChannel.current);
            }
        };
    }, [id]);

    useEffect(() => {
        if (localStream && videoRef.current) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream, videoEnabled]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, isConnected]);

    const loadAppointment = async () => {
        try {
            const { data: apt, error } = await supabase
                .from('appointments')
                .select('*, patients(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setAppointment(apt);

            // Fetch doctor details for prescription
            const user = await getCurrentUser();
            const { data: doctorData } = await supabase
                .from('doctors')
                .select('*')
                .eq('user_id', user.id)
                .single();
            setDoctor(doctorData);

            // Access camera for preview
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
            } catch (err) {
                console.error("Camera access error:", err);
                if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    toast.error("Camera is in use by another app. Trying audio-only...");
                    try {
                        const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                        setLocalStream(audioStream);
                        toast.success("Connected with audio only.");
                    } catch (audioErr) {
                        toast.error("Could not access microphone either. Please check hardware.");
                    }
                } else {
                    toast.error("Camera access denied or hardware error. Using audio if possible.");
                }
            }
        } catch (error) {
            console.error('Error loading appointment:', error);
            toast.error('Failed to load consultation details');
        } finally {
            setLoading(false);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const initWebRTC = async () => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        });

        // Log connection changes for diagnostics
        pc.oniceconnectionstatechange = () => {
            console.log(`❄️ ICE State: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                // Optionally handle reconnection logic here if needed
            }
        };

        if (!localStream) {
            console.error("Cannot initialize WebRTC: localStream is null");
            toast.error("Camera/Microphone not ready. Please ensure permissions are granted.");
            setIsJoined(false);
            return;
        }

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.ontrack = (event) => {
            console.log('📽️ Remote track received:', event.track.kind);
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            } else {
                // Fallback for browsers that don't bundle tracks into streams automatically
                const newStream = new MediaStream([event.track]);
                setRemoteStream(newStream);
            }
            setIsConnected(true);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                supabase.from('telemedicine_signaling').insert([{
                    appointment_id: id,
                    sender_role: 'doctor',
                    type: 'candidate',
                    payload: event.candidate
                }]).then(({ error }) => error && console.error('ICE candidate error:', error));
            }
        };

        peerConnection.current = pc;

        // Listen for signaling
        signalingChannel.current = supabase.channel(`signaling:${id}`);

        signalingChannel.current
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telemedicine_signaling', filter: `appointment_id=eq.${id}` },
                async payload => {
                    await handleSignaling(payload.new);
                })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Fetch existing answers/candidates from patient
                    const { data } = await supabase
                        .from('telemedicine_signaling')
                        .select('*')
                        .eq('appointment_id', id)
                        .eq('sender_role', 'patient')
                        .order('created_at', { ascending: true });

                    if (data) {
                        for (const msg of data) {
                            await handleSignaling(msg);
                        }
                    }
                }
            });

        async function handleSignaling(msg) {
            if (processedMessages.current.has(msg.id)) return;
            processedMessages.current.add(msg.id);

            if (pc.signalingState === 'closed') return;

            if (msg.sender_role === 'patient') {
                if (msg.type === 'answer') {
                    // Doctor expects answer ONLY when in have-local-offer state
                    if (pc.signalingState !== 'have-local-offer') {
                        console.log(`Skipping answer - signalingState is ${pc.signalingState}`);
                        return;
                    }

                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
                        // Process buffered candidates
                        while (pendingCandidates.current.length > 0) {
                            const candidate = pendingCandidates.current.shift();
                            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err =>
                                console.error('Error adding buffered candidate:', err)
                            );
                        }
                    } catch (err) {
                        console.error('Error setting remote answer:', err);
                    }
                } else if (msg.type === 'candidate') {
                    if (pc.remoteDescription && pc.remoteDescription.type) {
                        pc.addIceCandidate(new RTCIceCandidate(msg.payload)).catch(err => {
                            console.error('Error adding ICE candidate:', err);
                        });
                    } else {
                        console.log('Buffering ICE candidate - remote description not set yet');
                        pendingCandidates.current.push(msg.payload);
                    }
                }
            }
        }

        // Create Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await supabase.from('telemedicine_signaling').insert([{
            appointment_id: id,
            sender_role: 'doctor',
            type: 'offer',
            payload: offer
        }]);
    };

    const handleJoin = async () => {
        setIsJoined(true);
        try {
            // NUCLEAR RESET: Clear stale signaling messages for this appointment
            // to prevent InvalidStateError from old offers/answers
            await supabase.from('telemedicine_signaling').delete().eq('appointment_id', id);
            console.log('🧹 Signaling table cleared for fresh session');
        } catch (e) {
            console.warn('Signaling cleanup failed (may be expected if no records exist):', e);
        }
        toast.success("Opening MD Suite...");
        await initWebRTC();
    };

    const handleLeave = () => {
        if (localStream) {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        }
        router.push('/doctor/telemedicine');
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Verifying Credentials...</p>
        </div>
    );

    if (!appointment) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-2xl font-black text-gray-900 mb-4">Consultation Not Found</h1>
            <button onClick={() => router.push('/doctor/telemedicine')} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20">Back to Portal</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
            {/* Call Header */}
            <div className="p-4 md:p-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-teal-800 rounded-xl flex items-center justify-center text-white font-black shadow-lg ring-4 ring-teal-50">
                        H
                    </div>
                    <div>
                        <h1 className="text-gray-900 font-black leading-none">HealthON MD Suite</h1>
                        <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest mt-1">Virtual Consultation Room</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col text-right">
                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Consulting Patient</p>
                        <p className="text-gray-900 font-black leading-none">{appointment.patients?.name}</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 border border-gray-100">
                        <Settings size={20} />
                    </div>
                </div>
            </div>

            <main className="flex-1 p-4 md:p-8 flex flex-col lg:flex-row gap-8 overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-50/50 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-50/50 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex-[2] relative rounded-[3rem] bg-gray-100 shadow-2xl shadow-gray-200/50 border border-gray-200 overflow-hidden flex items-center justify-center group">
                    {!isJoined ? (
                        <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="max-w-md w-full"
                            >
                                <div className="w-24 h-24 bg-teal-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-teal-100">
                                    <Video size={48} className="text-teal-600" />
                                </div>
                                <h2 className="text-4xl font-black text-gray-900 mb-3 leading-tight tracking-tight">Suite Ready</h2>
                                <p className="text-gray-500 font-medium mb-10 leading-relaxed px-6">Your virtual clinic is configured. Patient <b>{appointment.patients?.name}</b> is ready to be admitted.</p>

                                <button
                                    onClick={handleJoin}
                                    className="w-full py-5 bg-teal-800 hover:bg-black text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-teal-500/20 active:scale-95"
                                >
                                    Admit Patient Now
                                </button>
                            </motion.div>
                        </div>
                    ) : !isConnected ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            {/* Simulated remote video (Patient) */}
                            <div className="text-center">
                                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-teal-600 mx-auto mb-6 shadow-xl border border-teal-50 animate-pulse">
                                    <User size={64} />
                                </div>
                                <p className="text-teal-800 font-black uppercase tracking-widest text-[10px]">Waiting for patient Nashrah...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-[#0B0F19] flex items-center justify-center">
                            {/* Real Patient Feed */}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* Scanning Line Decoration */}
                            <motion.div
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-[1px] bg-teal-500/10 shadow-[0_0_10px_rgba(20,184,166,0.5)] z-20 pointer-events-none"
                            />

                            <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
                                <div className="flex items-center gap-2 px-4 py-2 bg-teal-600/80 backdrop-blur-md rounded-2xl shadow-lg border border-teal-500/20">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_#fff]" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Terminal</span>
                                </div>
                                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest border border-white/10 shadow-sm">
                                    E2E ENCRYPTED • 60FPS
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Doctor Video Preview */}
                    <div className={`absolute bottom-6 right-6 w-48 aspect-video md:w-64 bg-white rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden z-30 transition-all duration-500 ${!isJoined ? 'md:w-80 shadow-teal-500/10' : ''}`}>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover scale-x-[-1]"
                        />
                        {!videoEnabled && (
                            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                <VideoOff size={32} className="text-gray-300" />
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-teal-900/80 backdrop-blur-md rounded-xl text-[9px] text-white font-black uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                            {audioEnabled ? <Mic size={10} /> : <MicOff size={10} className="text-rose-400" />}
                            Your Feed (MD)
                        </div>
                    </div>

                    {/* Controls Overlay */}
                    <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-6 z-40 w-full justify-center px-4">
                        <motion.button
                            whileHover={{ scale: 1.1, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleAudio}
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-3xl flex items-center justify-center transition-all shadow-xl ${audioEnabled ? 'bg-white text-gray-600 hover:text-teal-600 border border-gray-100' : 'bg-rose-500 text-white shadow-rose-500/20'}`}
                        >
                            {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleVideo}
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-3xl flex items-center justify-center transition-all shadow-xl ${videoEnabled ? 'bg-white text-gray-600 hover:text-teal-600 border border-gray-100' : 'bg-rose-500 text-white shadow-rose-500/20'}`}
                        >
                            {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1, y: -5, backgroundColor: '#000' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLeave}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/20 transition-all"
                        >
                            <PhoneOff size={24} />
                        </motion.button>
                    </div>

                    {/* UI Decorations */}
                    <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
                        <div className="flex items-center gap-2 px-4 py-2 bg-teal-600 rounded-2xl shadow-lg border border-teal-500/20">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_#fff]" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Terminal</span>
                        </div>
                        <div className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">
                            E2E Encrypted
                        </div>
                    </div>
                </div>

                {/* Sidebar: Patient Data Access & Chat */}
                <div className="w-full lg:w-[400px] flex flex-col gap-6">
                    <div className="bg-white rounded-[3rem] border border-gray-100 p-8 flex flex-col shadow-xl shadow-gray-200/50 h-[600px]">
                        {/* Tab Switcher for Sidebar */}
                        <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] mb-6 border border-gray-200/50">
                            <button className="flex-1 py-3 bg-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest text-teal-800">
                                Chat
                            </button>
                            <button className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600" onClick={() => setShowNotesModal(true)}>
                                Notes
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-50/50 relative">
                            <TelemedicineChat
                                appointmentId={id}
                                userRole="doctor"
                                userName={doctor?.name?.toLowerCase().startsWith('dr') ? doctor.name : `Dr. ${doctor?.name || "MD"}`}
                                avatarUrl={doctor?.avatar_url}
                            />
                        </div>

                        <div className="mt-6 space-y-3">
                            <h4 className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Quick Actions</h4>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPrescriptionModal(true)}
                                    className="flex-1 py-4 bg-plum-800 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:bg-plum-900 active:scale-95 shadow-xl shadow-plum-800/20"
                                >
                                    <Plus size={16} /> Prescription
                                </button>
                                <button
                                    onClick={() => setShowEHRModal(true)}
                                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95"
                                >
                                    <FileText size={16} /> EHR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <PrescriptionModal
                isOpen={showPrescriptionModal}
                onClose={() => setShowPrescriptionModal(false)}
                appointment={appointment}
                patient={appointment?.patients}
                doctor={doctor}
            />

            <AnimatePresence>
                {showEHRModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 shadow-2xl relative"
                        >
                            <button onClick={() => setShowEHRModal(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full">
                                <X size={24} className="text-gray-400" />
                            </button>

                            <h2 className="text-2xl font-black text-gray-900 mb-2">Electronic Health Record</h2>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Patient: {appointment?.patients?.name}</p>

                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                    <h3 className="text-sm font-black text-teal-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Activity size={16} /> Vitals & Metrics
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Weight</p>
                                            <p className="text-lg font-black text-gray-900">{appointment?.patients?.weight || 'N/A'} kg</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Height</p>
                                            <p className="text-lg font-black text-gray-900">{appointment?.patients?.height || 'N/A'} cm</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Blood Type</p>
                                            <p className="text-lg font-black text-gray-900">{appointment?.patients?.blood_type || 'N/A'}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Age</p>
                                            <p className="text-lg font-black text-gray-900">{appointment?.patients?.age || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                    <h3 className="text-sm font-black text-teal-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FileText size={16} /> Medical History
                                    </h3>
                                    <p className="text-gray-700 font-medium leading-relaxed">
                                        {appointment?.patients?.medical_history || 'No significant medical history recorded.'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showNotesModal && (
                    <div className="fixed inset-0 bg-teal-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl overflow-hidden relative"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                                        <MessageSquare className="text-teal-600" size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Internal Consultation Notes</h3>
                                </div>
                                <button onClick={() => setShowNotesModal(false)} className="p-2 hover:bg-gray-50 rounded-lg">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>
                            <textarea
                                value={internalNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                placeholder="Jot down symptoms, observations, or thoughts for reference..."
                                className="w-full h-48 bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all resize-none"
                            />
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => {
                                        toast.success("Notes saved for this session");
                                        setShowNotesModal(false);
                                    }}
                                    className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DataPoint({ label, value }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}:</span>
            <span className="text-xs font-black text-gray-900 text-right max-w-[180px] break-words">{value}</span>
        </div>
    );
}
