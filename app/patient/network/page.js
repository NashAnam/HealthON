'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser, getPatient, supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Share2, Plus, FileText, ThumbsUp, PartyPopper, Award, ArrowLeft, Edit, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function NetworkPage() {
    const router = useRouter();
    const [patient, setPatient] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [leaders, setLeaders] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    useEffect(() => {
        loadNetwork();
    }, []);

    const loadNetwork = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return;

            const { data: patientData } = await getPatient(user.id);
            setPatient(patientData);

            // Fetch posts and Leaderboard in parallel
            const [postsRes, leadersRes] = await Promise.all([
                supabase
                    .from('network_posts')
                    .select(`*, patients (name)`)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('patients')
                    .select('name, reward_points')
                    .order('reward_points', { ascending: false })
            ]);

            // Handle Posts
            if (postsRes.error) {
                console.error('Post load error:', postsRes.error);
                // Simple fallback
                const { data: simplePosts } = await supabase.from('network_posts').select('*').order('created_at', { ascending: false });
                if (simplePosts) setPosts(simplePosts.map(p => ({ ...p, patients: { name: 'Health Member' } })));
            } else {
                setPosts(postsRes.data || []);
            }

            // Handle Leaderboard
            if (leadersRes.data) {
                setLeaders(leadersRes.data.slice(0, 10));
                if (patientData) {
                    const rank = leadersRes.data.findIndex(p => p.name === patientData.name) + 1;
                    setMyRank(rank > 0 ? rank : null);
                }
            }

        } catch (error) {
            console.error('Network crash:', error);
            toast.error('Network temporarily unavailable');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPost.title || !newPost.content) return toast.error('Please add title and content');

        // Optimistic Update
        const optimisticPost = {
            id: Date.now(),
            title: newPost.title,
            content_text: newPost.content,
            created_at: new Date().toISOString(),
            patients: { name: patient.name },
            reactions: []
        };

        setPosts([optimisticPost, ...posts]);
        setIsCreating(false);
        // Real DB Insert
        const { data, error } = await supabase.from('network_posts').insert({
            patient_id: patient.id,
            title: newPost.title,
            content_text: newPost.content
        }).select();

        if (error) {
            console.error('Post creation error:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            console.error('Patient data:', { id: patient.id, user_id: patient.user_id });
            toast.error(`Failed to save post: ${error.message || 'Unknown error'}`);
            // Revert optimistic update
            setPosts(posts);
        } else {
            console.log('Post created successfully:', data);
            setNewPost({ title: '', content: '' });
            toast.success('Post shared successfully!');
            // Re-fetch to get actual IDs and sync state
            loadNetwork();
        }
    };

    const handleReaction = (postId, emoji) => {
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                // Simplified toggle logic for purely UI demo immediately
                const hasReacted = post.userReaction === emoji;
                return {
                    ...post,
                    userReaction: hasReacted ? null : emoji,
                    reactionCount: (post.reactionCount || 0) + (hasReacted ? -1 : 1)
                };
            }
            return post;
        }));
    };

    const handleDeletePost = async (postId) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const { error } = await supabase
                .from('network_posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;
            toast.success('Post deleted successfully');
            setPosts(posts.filter(p => p.id !== postId));
        } catch (error) {
            toast.error('Error deleting post');
        }
    };

    const handleUpdatePost = async () => {
        if (!editingPost.title || !editingPost.content_text) return toast.error('Fields cannot be empty');

        try {
            const { error } = await supabase
                .from('network_posts')
                .update({
                    title: editingPost.title,
                    content_text: editingPost.content_text
                })
                .eq('id', editingPost.id);

            if (error) throw error;
            toast.success('Post updated!');
            setIsEditing(false);
            setEditingPost(null);
            loadNetwork();
        } catch (error) {
            toast.error('Error updating post');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plum-600"></div></div>;

    return (
        <div className="min-h-screen bg-surface font-sans text-slate-900 pb-20">

            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="container mx-auto px-6 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/patient/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-900" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">Health Network</h1>
                            <p className="text-sm font-bold text-gray-400">Connect & Share Progress</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-plum-800 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-plum-800/20 flex items-center gap-2"
                    >
                        <Plus size={18} /> New Post
                    </button>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Leaderboard Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                                <Award className="text-amber-500" /> Community Leaders
                            </h3>
                            <div className="space-y-6">
                                {leaders.map((leader, index) => (
                                    <div key={index} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {leader.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{leader.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rank #{index + 1}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-black text-plum-800">{(leader.reward_points || 0).toLocaleString()}</span>
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-tight">Points</p>
                                        </div>
                                    </div>
                                ))}
                                {leaders.length === 0 && <p className="text-sm text-gray-400 text-center py-4 font-bold">No leaders yet!</p>}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-[2.5rem] p-8 text-white shadow-xl">
                            <h4 className="text-lg font-black uppercase tracking-tight mb-2">My Standing</h4>
                            <p className="text-teal-100 text-sm mb-6">You are ranked #{myRank || '--'} in the community.</p>
                            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-teal-200 uppercase tracking-widest">Your Points</p>
                                    <p className="text-2xl font-black">{(patient?.reward_points || 0).toLocaleString()}</p>
                                </div>
                                <Award className="w-8 h-8 text-teal-300" />
                            </div>
                        </div>
                    </div>

                    {/* Feed Section */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Feed */}
                        <div className="space-y-6">
                            {posts.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">No posts yet</h3>
                                    <p className="text-gray-500 mb-6 max-w-xs mx-auto">Be the first to share your health progress with the community!</p>
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="bg-plum-800 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all"
                                    >
                                        Share Your Story
                                    </button>
                                </div>
                            ) : (
                                posts.map((post) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        key={post.id}
                                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold">
                                                {post.patients?.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{post.patients?.name || 'Anonymous'}</h3>
                                                <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <h4 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h4>
                                        <p className="text-gray-600 mb-4 leading-relaxed">{post.content_text}</p>

                                        {post.attachment_url && (
                                            <div className="bg-plum-50 rounded-xl p-4 flex items-center gap-3 mb-4 border border-plum-100">
                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-plum-600 shadow-sm">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-plum-800">Case_Record.pdf</p>
                                                    <p className="text-xs text-plum-600">Attachment shared</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                                            <button onClick={() => handleReaction(post.id, '👍')} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${post.userReaction === '👍' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
                                                <ThumbsUp size={20} />
                                            </button>
                                            <button onClick={() => handleReaction(post.id, '❤️')} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${post.userReaction === '❤️' ? 'bg-rose-50 text-rose-600' : 'text-gray-400'}`}>
                                                <Heart size={20} />
                                            </button>
                                            <button onClick={() => handleReaction(post.id, '🎉')} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${post.userReaction === '🎉' ? 'bg-orange-50 text-orange-600' : 'text-gray-400'}`}>
                                                <PartyPopper size={20} />
                                            </button>

                                            {patient && post.patient_id === patient.id && (
                                                <div className="flex gap-1 ml-auto">
                                                    <button
                                                        onClick={() => {
                                                            setEditingPost(post);
                                                            setIsEditing(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-plum-600 hover:bg-plum-50 rounded-full transition-all"
                                                        title="Edit Post"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePost(post.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                        title="Delete Post"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}

                                            {!patient || post.patient_id !== patient.id && (
                                                <span className="text-xs text-gray-400 ml-auto">{post.reactionCount || 0} reactions</span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                    </div>

                </div> {/* End Grid */}
            </div> {/* End Container */}

            {/* Create Post Modal */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsCreating(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Post</h2>
                            <input
                                type="text"
                                placeholder="Title (e.g. My Recovery Journey)"
                                className="w-full mb-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-plum-500/20"
                                value={newPost.title}
                                onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                            />
                            <textarea
                                placeholder="Share your experience..."
                                className="w-full mb-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-plum-500/20 h-32 resize-none"
                                value={newPost.content}
                                onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreatePost}
                                    className="flex-1 py-4 bg-plum-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-plum-800/20"
                                >
                                    Share Post
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsEditing(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Edit Post</h2>
                                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Title"
                                className="w-full mb-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-plum-500/20"
                                value={editingPost.title}
                                onChange={e => setEditingPost({ ...editingPost, title: e.target.value })}
                            />
                            <textarea
                                placeholder="Edit your experience..."
                                className="w-full mb-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-plum-500/20 h-40 resize-none"
                                value={editingPost.content_text}
                                onChange={e => setEditingPost({ ...editingPost, content_text: e.target.value })}
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePost}
                                    className="flex-1 py-4 bg-plum-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-plum-800/20"
                                >
                                    Update Post
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}


