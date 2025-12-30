'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, MessageSquare, User, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TelemedicineChat({ appointmentId, userRole, userName, avatarUrl }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Initial Load
    useEffect(() => {
        if (!appointmentId) return;
        fetchMessages();

        // Subscription
        const channel = supabase
            .channel(`room:${appointmentId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'telemedicine_messages',
                filter: `appointment_id=eq.${appointmentId}`
            }, (payload) => {
                const newMsg = payload.new;
                setMessages(prev => {
                    // Prevent duplicates from optimistic updates
                    if (prev.some(m => m.id === newMsg.id || m.tempId === newMsg.temp_id)) {
                        return prev.map(m => m.tempId === newMsg.temp_id ? { ...newMsg, status: 'sent' } : m);
                    }
                    return [...prev, newMsg];
                });
                scrollToBottom();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Connected to Secure Chat Grid');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [appointmentId]);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('telemedicine_messages')
            .select('*')
            .eq('appointment_id', appointmentId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setMessages(data);
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !appointmentId) return;

        const tempId = Date.now().toString();
        const msgContent = newMessage.trim();

        // Optimistic Update
        const optimisticMsg = {
            id: tempId, // Temporary ID
            tempId: tempId,
            appointment_id: appointmentId,
            sender_role: userRole,
            sender_name: userName,
            message: msgContent,
            created_at: new Date().toISOString(),
            status: 'sending'
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        scrollToBottom();

        // Send to Backend
        try {
            const { error } = await supabase.from('telemedicine_messages').insert({
                appointment_id: appointmentId,
                sender_role: userRole,
                sender_name: userName,
                message: msgContent,
                temp_id: tempId // Identify this message for deduplication on return
            });

            if (error) {
                console.error('Send error:', error, 'Full details:', JSON.stringify(error, null, 2));
                toast.error(`Message failed: ${error.message || 'Connection refused (RLS)'}`);
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
            }
        } catch (err) {
            console.error('Chat exception:', err);
            toast.error('Network error sending message');
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface-50">
            {/* Header / Empty State */}
            {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                        <MessageSquare size={32} className="text-gray-400" />
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-loose">
                        Encrypted Medical Line<br />
                        Start typing to connect...
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => {
                        const isMe = msg.sender_role === userRole;
                        const isSystem = msg.sender_role === 'system';

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-4">
                                    <span className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                                        {msg.message}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${isMe
                                        ? 'bg-plum-600 text-white rounded-tr-none'
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                        }`}>
                                        {msg.message}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 px-1">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && (
                                            msg.status === 'sending' ? (
                                                <div className="w-2 h-2 rounded-full border border-gray-300 border-t-plum-500 animate-spin" />
                                            ) : msg.status === 'error' ? (
                                                <span className="text-rose-500 text-[9px] font-bold">Failed</span>
                                            ) : (
                                                <Check size={10} className="text-plum-400" />
                                            )
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={userRole === 'doctor' ? "Type to patient..." : "Type to Dr..."}
                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-plum-500/10 focus:border-plum-200 transition-all placeholder:text-gray-400"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-3 bg-plum-800 text-white rounded-xl shadow-lg shadow-plum-800/20 hover:bg-black transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        <Send size={18} />
                    </motion.button>
                </form>
            </div>
        </div>
    );
}
