'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getNutritionist, getNutritionistPatients, supabase } from '@/lib/supabase';
import { Users, Search, Calendar, FileText, ArrowLeft, Phone, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NutritionistPatientsPage() {
    const router = useRouter();
    const [nutritionist, setNutritionist] = useState(null);
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) {
                router.push('/expert-login');
                return;
            }

            const { data: nutriData } = await getNutritionist(user.id);
            if (!nutriData) {
                router.push('/complete-profile');
                return;
            }
            setNutritionist(nutriData);

            const { data: patientsData } = await getNutritionistPatients(nutriData.id);

            // Deduplicate unique patients
            const uniquePatients = [];
            const patientIds = new Set();

            (patientsData || []).forEach(item => {
                if (item.patients && !patientIds.has(item.patients.id)) {
                    patientIds.add(item.patients.id);
                    uniquePatients.push(item.patients);
                }
            });

            setPatients(uniquePatients);
        } catch (error) {
            console.error('Error loading patients:', error);
            toast.error('Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.push('/nutritionist/dashboard')}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">My Patients</h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Connected Database</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Search & Filters */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium transition-all"
                        />
                    </div>
                </div>

                {/* Patients Grid */}
                {filteredPatients.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Patients Found</h3>
                        <p className="text-gray-500 font-medium max-w-xs mx-auto">
                            Patients who book appointments with you will appear here automatically.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPatients.map((patient) => (
                            <div
                                key={patient.id}
                                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 font-black text-xl border border-green-100 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        {patient.name?.charAt(0) || 'P'}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight truncate">{patient.name}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            {patient.age ? `${patient.age} Years • ` : ''}{patient.blood_group || 'Verified Patient'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                                        <Mail className="w-4 h-4 text-green-600" />
                                        <span className="truncate">{patient.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                                        <Phone className="w-4 h-4 text-green-600" />
                                        <span>{patient.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                                        <User className="w-4 h-4 text-green-600" />
                                        <span>{patient.height ? `${patient.height}cm` : ''} {patient.weight ? `• ${patient.weight}kg` : ''}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => router.push(`/nutritionist/diet-plans?patient=${patient.id}`)}
                                        className="py-3 bg-green-50 text-green-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all text-center"
                                    >
                                        Diet Plan
                                    </button>
                                    <button
                                        onClick={() => router.push(`/nutritionist/appointments?patient=${patient.id}`)}
                                        className="py-3 bg-gray-50 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all text-center"
                                    >
                                        History
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
