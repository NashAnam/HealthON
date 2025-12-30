'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Video, VideoOff, Mic, MicOff, PhoneOff, User, MessageSquare, Settings, Share2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import TelemedicineChat from '@/components/TelemedicineChat';

export default function TelemedicineJoinPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Configuring Secure Line...</p>
            </div>
        }>
            <TelemedicineRoomContent />
        </Suspense>
    );
}

function TelemedicineRoomContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isJoined, setIsJoined] = useState(false);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);

    useEffect(() => {
        loadAppointment();
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnection.current) {
                peerConnection.current.close();
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
                .select('*, doctors(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setAppointment(apt);

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
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        if (!localStream) {
            console.error("Cannot initialize WebRTC: localStream is null");
            toast.error("Camera/Microphone not ready. Please ensure permissions are granted.");
            setIsJoined(false);
            return;
        }

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            setIsConnected(true);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                supabase.from('telemedicine_signaling').insert([{
                    appointment_id: id,
                    sender_role: 'patient',
                    type: 'candidate',
                    payload: event.candidate
                }]).then(({ error }) => error && console.error('ICE candidate error:', error));
            }
        };

        peerConnection.current = pc;

        // Listen for signaling
        const channel = supabase.channel(`signaling:${id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telemedicine_signaling', filter: `appointment_id=eq.${id}` },
                async payload => {
                    handleSignaling(payload.new);
                })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Fetch existing messages to catch anything missed
                    const { data } = await supabase
                        .from('telemedicine_signaling')
                        .select('*')
                        .eq('appointment_id', id)
                        .eq('sender_role', 'doctor')
                        .order('created_at', { ascending: true });

                    if (data) {
                        for (const msg of data) {
                            handleSignaling(msg);
                        }
                    }
                }
            });

        async function handleSignaling(msg) {
            if (msg.sender_role === 'doctor') {
                if (msg.type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    await supabase.from('telemedicine_signaling').insert([{
                        appointment_id: id,
                        sender_role: 'patient',
                        type: 'answer',
                        payload: answer
                    }]);
                } else if (msg.type === 'candidate') {
                    pc.addIceCandidate(new RTCIceCandidate(msg.payload));
                }
            }
        }
    };

    const handleJoin = async () => {
        setIsJoined(true);
        toast.success("Joining secure session...");
        await initWebRTC();
    };

    const handleLeave = () => {
        if (localStream) {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        }
        router.push('/patient/dashboard');
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Establishing Secure Connection...</p>
        </div>
    );

    if (!appointment) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-2xl font-black text-gray-900 mb-4">Consultation Not Found</h1>
            <p className="text-gray-500 mb-8 max-w-sm px-6 font-medium leading-relaxed">This appointment might have been rescheduled, cancelled, or you might be using an outdated link.</p>
            <button onClick={() => router.push('/patient/dashboard')} className="px-10 py-4 bg-indigo-600 text-white rounded-[2rem] font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">Go to Home Dashboard</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
            {/* Call Header */}
            <div className="p-4 md:p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-800 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/10">
                        H
                    </div>
                    <div>
                        <h1 className="text-gray-900 font-black leading-none tracking-tight">HealthON Virtual</h1>
                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1.5">Telemedicine Session</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col text-right">
                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1.5">Your Consultant</p>
                        <p className="text-gray-900 font-black leading-none">Dr. {appointment.doctors?.name}</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 border border-gray-100">
                        <Settings size={20} />
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 flex flex-col lg:flex-row gap-8 overflow-hidden relative">
                {/* Background Blobs */}
                <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none" />

                {/* Main Video Area */}
                <div className="flex-1 relative rounded-[3rem] bg-gray-100 shadow-2xl shadow-indigo-100/50 border border-gray-200 overflow-hidden flex items-center justify-center group">
                    {!isJoined ? (
                        <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center text-gray-900">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="max-w-md w-full"
                            >
                                <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-indigo-100">
                                    <Video size={48} className="text-indigo-600" />
                                </div>
                                <h2 className="text-4xl font-black mb-4 leading-tight tracking-tight">Join Dr. {appointment.doctors?.name?.split(' ').pop()}</h2>
                                <p className="text-gray-500 font-medium mb-10 leading-relaxed px-6">Your connection is private and secure. Tap below to start your medical session.</p>

                                <button
                                    onClick={handleJoin}
                                    className="w-full py-5 bg-indigo-600 hover:bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                                >
                                    Start Video Session
                                </button>
                            </motion.div>
                        </div>
                    ) : !isConnected ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            {/* Waiting for Doctor */}
                            <div className="text-center">
                                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6 shadow-xl border border-indigo-50 animate-pulse">
                                    <User size={64} />
                                </div>
                                <p className="text-indigo-800 font-black uppercase tracking-widest text-[10px]">Waiting for Dr. {appointment.doctors?.name} to admit you...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                            {/* Real Doctor Feed */}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* Signal Waves Decoration */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-indigo-500/30 rounded-full animate-ping [animation-duration:3s]" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-indigo-500/20 rounded-full animate-ping [animation-duration:4s]" />
                            </div>

                            <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
                                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 backdrop-blur-md rounded-2xl shadow-lg border border-indigo-500/20">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_#fff]" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Encounter Active</span>
                                </div>
                                <div className="px-4 py-2 bg-white/30 backdrop-blur-md rounded-2xl text-[10px] font-black text-white uppercase tracking-widest border border-white/20 shadow-sm">
                                    E2E ENCRYPTED
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Local Video Preview */}
                    <div className={`absolute bottom-6 right-6 w-48 aspect-video md:w-64 bg-white rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden z-30 transition-all duration-500 ${!isJoined ? 'md:w-80 shadow-indigo-500/10' : ''}`}>
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
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-indigo-900/80 backdrop-blur-md rounded-xl text-[9px] text-white font-black uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_#818cf8]" />
                            {audioEnabled ? <Mic size={10} /> : <MicOff size={10} className="text-rose-400" />}
                            Your Feed
                        </div>
                    </div>

                    {/* Controls Overlay */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-6 z-40 w-full justify-center px-4">
                        <motion.button
                            whileHover={{ scale: 1.1, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleAudio}
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl ${audioEnabled ? 'bg-white text-gray-600 hover:text-indigo-600 border border-gray-100' : 'bg-rose-500 text-white shadow-rose-500/20'}`}
                        >
                            {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleVideo}
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl ${videoEnabled ? 'bg-white text-gray-600 hover:text-indigo-600 border border-gray-100' : 'bg-rose-500 text-white shadow-rose-500/20'}`}
                        >
                            {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1, y: -5, backgroundColor: '#000' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLeave}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/20 transition-all"
                        >
                            <PhoneOff size={24} />
                        </motion.button>
                    </div>

                    {/* UI Decorations */}
                    <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-600 rounded-2xl shadow-lg border border-rose-500/20">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_#fff]" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Encounter Active</span>
                        </div>
                        <div className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">
                            00:00:00
                        </div>
                    </div>
                    <div className="absolute top-8 right-8 flex items-center gap-2 z-10">
                        <button className="p-4 bg-white/80 backdrop-blur-md rounded-[1.5rem] text-gray-400 hover:text-indigo-600 border border-gray-100 shadow-sm transition-all group">
                            <Maximize2 size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Sidebar: Consultation Details */}
                <div className="w-full lg:w-[350px] flex flex-col gap-6">
                    <div className="bg-white rounded-[3rem] border border-gray-100 p-8 flex-1 flex flex-col shadow-xl shadow-gray-100/50">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <MessageSquare className="text-indigo-600" size={18} />
                            </div>
                            <h3 className="text-gray-900 font-black text-xs uppercase tracking-widest">Secure Messages</h3>
                        </div>
                        <div className="flex-1 overflow-hidden bg-gray-50/50 rounded-[2rem] border border-gray-100 relative">
                            <TelemedicineChat
                                appointmentId={id}
                                userRole="patient"
                                userName={appointment.patients?.name || "Patient"}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
