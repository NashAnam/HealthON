'use client';
import { useState, useEffect } from 'react';
import { supabase, createBlog, getBlogs, deleteBlog } from '@/lib/supabase';
import { RefreshCw, Stethoscope, FlaskConical, CheckCircle2, XCircle, FileText, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [activeTab, setActiveTab] = useState('doctors');
    const [doctors, setDoctors] = useState([]);
    const [labs, setLabs] = useState([]);
    const [nutritionists, setNutritionists] = useState([]);
    const [physiotherapists, setPhysiotherapists] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [showBlogEditor, setShowBlogEditor] = useState(false);
    const [currentBlog, setCurrentBlog] = useState({ title: '', content: '', author: 'Admin' });

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth');
        if (auth === process.env.NEXT_PUBLIC_ADMIN_PASSPHRASE || auth === 'Admin@HealthOn2026') {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [activeTab, isAuthenticated]);

    const handleLogin = (e) => {
        e.preventDefault();
        const secret = process.env.NEXT_PUBLIC_ADMIN_PASSPHRASE || 'Admin@HealthOn2026';
        if (passphrase === secret) {
            setIsAuthenticated(true);
            localStorage.setItem('admin_auth', passphrase);
            toast.success('Access Granted');
        } else {
            toast.error('Invalid Passphrase');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_auth');
        toast.success('Logged out');
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'doctors') {
                await fetchPendingDoctors();
            } else if (activeTab === 'labs') {
                await fetchPendingLabs();
            } else if (activeTab === 'nutritionists') {
                await fetchPendingNutritionists();
            } else if (activeTab === 'physiotherapists') {
                await fetchPendingPhysiotherapists();
            } else if (activeTab === 'blogs') {
                await fetchAdminBlogs();
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingDoctors = async () => {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .or('verified.eq.false,verified.is.null')
            .order('created_at', { ascending: false });

        if (error) throw error;
        setDoctors(data || []);
    };

    const fetchPendingLabs = async () => {
        const { data, error } = await supabase
            .from('labs')
            .select('*')
            .or('verified.eq.false,verified.is.null')
            .order('created_at', { ascending: false });

        if (error) throw error;
        setLabs(data || []);
    };
    const fetchPendingNutritionists = async () => {
        const { data, error } = await supabase
            .from('nutritionists')
            .select('*')
            .or('verified.eq.false,verified.is.null')
            .order('created_at', { ascending: false });
        if (error) throw error;
        setNutritionists(data || []);
    };
    const fetchPendingPhysiotherapists = async () => {
        const { data, error } = await supabase
            .from('physiotherapists')
            .select('*')
            .or('verified.eq.false,verified.is.null')
            .order('created_at', { ascending: false });
        if (error) throw error;
        setPhysiotherapists(data || []);
    };

    const fetchAdminBlogs = async () => {
        const { data, error } = await getBlogs();
        if (error) {
            console.error("Error fetching blogs:", error);
        }
        setBlogs(data || []);
    };

    const handleVerifyDoctor = async (doctorId, doctorName) => {
        setProcessingId(doctorId);
        try {
            const { error } = await supabase
                .from('doctors')
                .update({ verified: true })
                .eq('id', doctorId);

            if (error) throw error;
            toast.success('Doctor verified successfully!');
            fetchData();
        } catch (error) {
            console.error('Doctor verification error:', error);
            toast.error('Error verifying doctor: ' + (error.message || 'Unknown error'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleVerifyLab = async (labId, labName) => {
        setProcessingId(labId);
        try {
            const { error } = await supabase
                .from('labs')
                .update({ verified: true })
                .eq('id', labId);

            if (error) throw error;
            toast.success('Lab verified successfully!');
            fetchData();
        } catch (error) {
            console.error('Lab verification error:', error);
            toast.error('Error verifying lab: ' + (error.message || 'Unknown error'));
        } finally {
            setProcessingId(null);
        }
    };
    const handleVerifyNutritionist = async (id) => {
        setProcessingId(id);
        try {
            const { error } = await supabase.from('nutritionists').update({ verified: true }).eq('id', id);
            if (error) throw error;
            toast.success('Nutritionist verified!');
            fetchData();
        } catch (error) { toast.error('Error verifying'); } finally { setProcessingId(null); }
    };
    const handleVerifyPhysiotherapist = async (id) => {
        setProcessingId(id);
        try {
            const { error } = await supabase.from('physiotherapists').update({ verified: true }).eq('id', id);
            if (error) throw error;
            toast.success('Physiotherapist verified!');
            fetchData();
        } catch (error) { toast.error('Error verifying'); } finally { setProcessingId(null); }
    };

    const handleReject = async (id, type) => {
        setProcessingId(id);
        try {
            if (type === 'doctor') {
                await supabase.from('doctors').delete().eq('id', id);
            } else if (type === 'lab') {
                await supabase.from('labs').delete().eq('id', id);
            } else if (type === 'nutritionist') {
                await supabase.from('nutritionists').delete().eq('id', id);
            } else if (type === 'physiotherapist') {
                await supabase.from('physiotherapists').delete().eq('id', id);
            }

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} rejected`);
            fetchData();
        } catch (error) {
            toast.error(`Error rejecting ${type}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handlePublishBlog = async () => {
        if (!currentBlog.title || !currentBlog.content) {
            toast.error('Please fill in title and content');
            return;
        }

        try {
            const { error } = await createBlog(currentBlog);
            if (error) throw error;
            toast.success('Blog published successfully!');
            setShowBlogEditor(false);
            setCurrentBlog({ title: '', content: '', author: 'Admin' });
            fetchData();
        } catch (error) {
            console.error('Error publishing blog:', error);
            toast.error('Failed to publish blog');
        }
    };

    const handleDeleteBlog = async (id) => {
        if (!confirm('Are you sure you want to delete this blog?')) return;
        try {
            const { error } = await deleteBlog(id);
            if (error) throw error;
            toast.success('Blog deleted');
            fetchData();
        } catch (error) {
            console.error('Error deleting blog:', error);
            toast.error('Failed to delete blog');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-violet-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-violet-600/20">
                            <RefreshCw className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Security Gateway</h2>
                        <p className="text-slate-400 text-sm font-medium">Enter the administrative passphrase to proceed</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Passphrase"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-3xl px-8 py-5 text-white focus:outline-none focus:ring-4 focus:ring-violet-600/20 transition-all text-center tracking-[0.3em] font-black"
                        />
                        <button
                            type="submit"
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-3xl py-5 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Verify Identity
                        </button>
                    </form>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">HealthOn Automated Security Protocol 4.0</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">HealthON <span className="text-violet-600 italic">Vault</span></h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Administrative Control Mesh</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 flex-wrap">
                    <button
                        onClick={() => setActiveTab('doctors')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'doctors'
                            ? 'bg-violet-600 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Stethoscope className="w-5 h-5" />
                        Doctors ({doctors.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('labs')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'labs'
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <FlaskConical className="w-5 h-5" />
                        Labs ({labs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('nutritionists')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'nutritionists'
                            ? 'bg-teal-600 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <RefreshCw className="w-5 h-5" />
                        Nutritionists ({nutritionists.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('physiotherapists')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'physiotherapists'
                            ? 'bg-orange-600 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <RefreshCw className="w-5 h-5" />
                        Physio ({physiotherapists.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('blogs')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'blogs'
                            ? 'bg-rose-600 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <FileText className="w-5 h-5" />
                        Manage Blogs
                    </button>
                    <button
                        onClick={fetchData}
                        className="ml-auto p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                    >
                        <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    {activeTab === 'doctors' && (
                        <DoctorsTable
                            doctors={doctors}
                            loading={loading}
                            processingId={processingId}
                            onVerify={handleVerifyDoctor}
                            onReject={(id) => handleReject(id, 'doctor')}
                        />
                    )}
                    {activeTab === 'labs' && (
                        <LabsTable
                            labs={labs}
                            loading={loading}
                            processingId={processingId}
                            onVerify={handleVerifyLab}
                            onReject={(id) => handleReject(id, 'lab')}
                        />
                    )}
                    {activeTab === 'nutritionists' && (
                        <GenericExpertTable
                            data={nutritionists}
                            loading={loading}
                            processingId={processingId}
                            onVerify={handleVerifyNutritionist}
                            onReject={(id) => handleReject(id, 'nutritionist')}
                            type="Nutritionists"
                        />
                    )}
                    {activeTab === 'physiotherapists' && (
                        <GenericExpertTable
                            data={physiotherapists}
                            loading={loading}
                            processingId={processingId}
                            onVerify={handleVerifyPhysiotherapist}
                            onReject={(id) => handleReject(id, 'physiotherapist')}
                            type="Physiotherapists"
                        />
                    )}
                    {activeTab === 'blogs' && (
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Published Blogs</h3>
                                <button
                                    onClick={() => setShowBlogEditor(!showBlogEditor)}
                                    className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    {showBlogEditor ? 'Cancel' : 'Write New Blog'}
                                </button>
                            </div>

                            {showBlogEditor && (
                                <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
                                    <h4 className="text-lg font-bold text-slate-700 mb-4">New Blog Post</h4>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Blog Title"
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                            value={currentBlog.title}
                                            onChange={(e) => setCurrentBlog({ ...currentBlog, title: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Author Name"
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                            value={currentBlog.author}
                                            onChange={(e) => setCurrentBlog({ ...currentBlog, author: e.target.value })}
                                        />
                                        <textarea
                                            placeholder="Blog Content..."
                                            rows="8"
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                                            value={currentBlog.content}
                                            onChange={(e) => setCurrentBlog({ ...currentBlog, content: e.target.value })}
                                        />
                                        <button
                                            onClick={handlePublishBlog}
                                            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-all"
                                        >
                                            Publish Post
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {loading && !blogs.length ? (
                                    <div className="text-center py-10 text-slate-500">Loading blogs...</div>
                                ) : blogs.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl">No blogs found.</div>
                                ) : (
                                    blogs.map(blog => (
                                        <div key={blog.id} className="flex justify-between items-start p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900">{blog.title}</h4>
                                                <p className="text-sm text-slate-500 mb-2">By {blog.author} • {new Date(blog.created_at).toLocaleDateString()}</p>
                                                <p className="text-slate-600 line-clamp-2">{blog.content}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteBlog(blog.id)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all ml-4"
                                                title="Delete Blog"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DoctorsTable({ doctors, loading, processingId, onVerify, onReject }) {
    return (
        <table className="w-full">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Name</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Qualification</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Experience</th>
                    <th className="p-6 text-right font-bold text-slate-600 text-sm">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-violet-600 rounded-full animate-spin"></div>
                                Loading doctors...
                            </div>
                        </td>
                    </tr>
                ) : doctors.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-500">
                            No pending doctor verifications
                        </td>
                    </tr>
                ) : (
                    doctors.map((doctor) => (
                        <tr key={doctor.id} className="border-b hover:bg-slate-50">
                            <td className="p-6 font-bold text-slate-900">{doctor.name}</td>
                            <td className="p-6 text-sm text-slate-700">{doctor.qualification}</td>
                            <td className="p-6 text-sm text-slate-700">{doctor.experience?.toString().toLowerCase().includes('year') ? doctor.experience : `${doctor.experience} years`}</td>
                            <td className="p-6 text-right">
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => onVerify(doctor.id, doctor.name)}
                                        disabled={processingId === doctor.id}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processingId === doctor.id ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        Verify
                                    </button>
                                    <button
                                        onClick={() => onReject(doctor.id)}
                                        disabled={processingId === doctor.id}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}

function LabsTable({ labs, loading, processingId, onVerify, onReject }) {
    return (
        <table className="w-full">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Name</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Address</th>
                    <th className="p-6 text-right font-bold text-slate-600 text-sm">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan="3" className="p-12 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
                                Loading labs...
                            </div>
                        </td>
                    </tr>
                ) : labs.length === 0 ? (
                    <tr>
                        <td colSpan="3" className="p-12 text-center text-slate-500">
                            No pending lab verifications
                        </td>
                    </tr>
                ) : (
                    labs.map((lab) => (
                        <tr key={lab.id} className="border-b hover:bg-slate-50">
                            <td className="p-6 font-bold text-slate-900">{lab.name}</td>
                            <td className="p-6 text-sm text-slate-700">{lab.address}</td>
                            <td className="p-6 text-right">
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => onVerify(lab.id, lab.name)}
                                        disabled={processingId === lab.id}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processingId === lab.id ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        Verify
                                    </button>
                                    <button
                                        onClick={() => onReject(lab.id)}
                                        disabled={processingId === lab.id}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}
function GenericExpertTable({ data, loading, processingId, onVerify, onReject, type }) {
    return (
        <table className="w-full">
            <thead className="bg-slate-50 border-b">
                <tr>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Name</th>
                    <th className="p-6 text-left font-bold text-slate-600 text-sm">Qualification</th>
                    <th className="p-6 text-right font-bold text-slate-600 text-sm">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan="3" className="p-12 text-center text-slate-500">Loading {type}...</td></tr>
                ) : data.length === 0 ? (
                    <tr><td colSpan="3" className="p-12 text-center text-slate-500">No pending {type}</td></tr>
                ) : (
                    data.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-slate-50">
                            <td className="p-6 font-bold text-slate-900">{item.name}</td>
                            <td className="p-6 text-sm text-slate-700">{item.qualification}</td>
                            <td className="p-6 text-right">
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => onVerify(item.id)}
                                        disabled={processingId === item.id}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processingId === item.id ? "..." : <CheckCircle2 className="w-4 h-4" />}
                                        Verify
                                    </button>
                                    <button
                                        onClick={() => onReject(item.id)}
                                        disabled={processingId === item.id}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}

export function StatCard({ icon: Icon, label, value, color }) {
    // ... logic if needed, but not exported here
}
