'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getLabReports } from '@/lib/supabase';
import { FileText, Calendar, Download, ChevronLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return router.replace('/login');

            const { data, error } = await getLabReports(user.id);
            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error('Error loading reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports.filter(report =>
        report.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.lab_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">My Lab Reports</h1>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center gap-3">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by test or lab name..."
                        className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Reports Found</h3>
                        <p className="text-slate-500">You haven't received any lab reports yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReports.map((report) => (
                            <div key={report.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{report.test_name}</h3>
                                        <p className="text-sm text-slate-500 flex items-center gap-2">
                                            <span className="font-medium text-slate-700">{report.lab_name}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(report.test_date).toLocaleDateString()}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href={report.report_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-slate-50 hover:bg-violet-50 text-slate-600 hover:text-violet-600 rounded-xl transition-colors"
                                    title="Download Report"
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
