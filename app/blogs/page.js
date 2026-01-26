'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { getBlogs } from '@/lib/supabase';

export default function BlogsPage() {
    const router = useRouter();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBlogs();
    }, []);

    const loadBlogs = async () => {
        try {
            const { data, error } = await getBlogs();
            if (error) throw error;
            setBlogs(data || []);
        } catch (error) {
            console.error('Error loading blogs:', error);
            // toast.error('Failed to load blogs'); // Suppress error if table doesn't exist yet
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                        <Image src="/logo.png" alt="HealthON" width={40} height={40} className="rounded-xl" />
                        <span className="text-2xl font-black tracking-tight text-[#1a1a2e]">HealthON</span>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-[#602E5A] mb-2">Health Blogs</h1>
                        <p className="text-gray-500 font-medium">Share health tips and insights</p>
                    </div>
                </div>

                {/* Blog List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#602E5A] mx-auto"></div>
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center shadow-lg">
                            <p className="text-gray-400 font-medium text-lg">No blogs published yet.</p>
                        </div>
                    ) : (
                        blogs.map((blog) => (
                            <div key={blog.id} className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 mb-2">{blog.title}</h2>
                                        <p className="text-sm text-gray-500 font-medium">By {blog.author} • {new Date(blog.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{blog.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
