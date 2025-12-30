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
            <div className="p-4 md:p-5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-plum-800 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-plum-500/10 text-sm">
                        H
                    </div>
                    <div>
                        <h1 className="text-slate-900 font-black leading-none tracking-tight text-base">HealthON Virtual</h1>
                        <p className="text-[9px] text-plum-600 font-black uppercase tracking-[0.15em] mt-1.5">Telemedicine Session</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col text-right">
                        <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Your Consultant</p>
                        <p className="text-slate-900 font-black leading-none text-sm">Dr. {appointment.doctors?.name}</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <Settings size={18} />
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-6 flex flex-col lg:flex-row gap-6 overflow-hidden relative">
                {/* Main Video Area */}
                <div className="flex-1 relative rounded-[2.5rem] bg-slate-900 shadow-2xl overflow-hidden flex items-center justify-center group border border-slate-800">
                    {!isJoined ? (
                        <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 text-center">
                            {/* Dynamic Background for Lobby */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-plum-50 rounded-full blur-[120px]" />
                                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-teal-50 rounded-full blur-[120px]" />
                            </div>

                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="max-w-md w-full relative z-10"
                            >
                                <div className="w-20 h-20 bg-plum-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-plum-100/50">
                                    <Video size={32} className="text-plum-600" />
                                </div>
                                <h2 className="text-3xl font-black mb-3 text-slate-900 tracking-tight leading-tight">Join Dr. {appointment.doctors?.name?.split(' ').pop()}</h2>
                                <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">A private, secure medical line is ready for your consultation.</p>

                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                                                <Mic size={16} className={audioEnabled ? "text-teal-600" : "text-slate-300"} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Microphone</span>
                                        </div>
                                        <button onClick={toggleAudio} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${audioEnabled ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                            {audioEnabled ? 'Active' : 'Muted'}
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                                                <Video size={16} className={videoEnabled ? "text-teal-600" : "text-slate-300"} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Camera</span>
                                        </div>
                                        <button onClick={toggleVideo} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${videoEnabled ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                            {videoEnabled ? 'Active' : 'Disabled'}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleJoin}
                                    className="w-full py-4 bg-plum-800 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-plum-800/20 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Enter Consultation
                                </button>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                            {!isConnected ? (
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mx-auto mb-6 shadow-xl border border-slate-700 animate-pulse">
                                        <User size={48} />
                                    </div>
                                    <p className="text-teal-400 font-black uppercase tracking-widest text-[10px]">Calling Dr. {appointment.doctors?.name}...</p>
                                </div>
                            ) : (
                                <>
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Overlay Data */}
                                    <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]" />
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">LIVE SESSION</span>
                                        </div>
                                        <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-[9px] font-black text-white/60 uppercase tracking-widest border border-white/5">
                                            SECURE LINE
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Active Controls Bar - Only when joined */}
                    {isJoined && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40 bg-black/20 backdrop-blur-xl p-3 rounded-[2rem] border border-white/10 shadow-2xl">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleAudio}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${audioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}
                            >
                                {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleVideo}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${videoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}
                            >
                                {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                            </motion.button>
                            <div className="w-px h-8 bg-white/10 mx-1" />
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: '#e11d48' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLeave}
                                className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/20 transition-all"
                            >
                                <PhoneOff size={20} />
                            </motion.button>
                        </div>
                    )}

                    {/* Local Feed Overlay - Only when joined */}
                    {isJoined && (
                        <div className="absolute top-6 right-6 w-32 aspect-video md:w-48 bg-slate-800 rounded-2xl border-2 border-slate-700/50 shadow-2xl overflow-hidden z-30 group/local">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                            {!videoEnabled && (
                                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                    <VideoOff size={20} className="text-slate-600" />
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[7px] text-white/80 font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/5">
                                <div className="w-1 h-1 bg-teal-400 rounded-full shadow-[0_0_5px_#2dd4bf]" />
                                ME
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Consultation Details */}
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-6 flex-1 flex flex-col shadow-sm">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="text-plum-600" size={14} />
                                <h3 className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Medical Line</h3>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-teal-50 rounded-lg">
                                <div className="w-1 h-1 bg-teal-500 rounded-full" />
                                <span className="text-[8px] font-black text-teal-700 uppercase tracking-widest">Encrypted</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-50 relative">
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
