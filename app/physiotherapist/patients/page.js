'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPhysiotherapist, getPhysiotherapistPatients, supabase } from '@/lib/supabase';
import { Users, Search, Calendar, FileText, ArrowLeft, Phone, Mail, User, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PhysiotherapistPatientsPage() {
    const router = useRouter();
    const [physio, setPhysio] = useState(null);
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterPatients();
    }, [patients, searchTerm]);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: physioData } = await getPhysiotherapist(user.id);
            if (!physioData) {
                router.push('/complete-profile');
                return;
            }
            setPhysio(physioData);

            // Fetch assigned patients
            const { data: patientsData } = await getPhysiotherapistPatients(physioData.id);

            // Process unique patients
            const uniquePatients = [];
            const seenIds = new Set();

            if (patientsData && patientsData.length > 0) {
                patientsData.forEach(item => {
                    if (item.patients && !seenIds.has(item.patients.id)) {
                        seenIds.add(item.patients.id);
                        uniquePatients.push({
                            ...item.patients,
                            lastVisit: item.appointment_date || 'N/A',
                            visitCount: patientsData.filter(p => p.patient_id === item.patients.id).length
                        });
                    }
                });
            } else {
                // FORCE EMPTY if no connections (Strict Security)
                setPatients([]);
                return;
            }

            setPatients(uniquePatients);
        } catch (error) {
            console.error('Error loading patients:', error);
            toast.error('Failed to load patient records');
        }
    };

    const filterPatients = () => {
        if (!searchTerm) {
            setFilteredPatients(patients);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();
        const filtered = patients.filter(p =>
            p.name?.toLowerCase().includes(lowerTerm) ||
            p.phone?.includes(searchTerm) ||
            p.email?.toLowerCase().includes(lowerTerm)
        );
        setFilteredPatients(filtered);
    };

    if (!physio) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDF8FA]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-800"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDF8FA] pb-10">
            {/* Header */}
            <header className="bg-white px-6 py-6 sticky top-0 z-30 border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-[#4a2b3d] uppercase tracking-tight">My Patients</h1>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Physiotherapy Records</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                            <Users size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{patients.length}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Patients</p>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
                            <Activity size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{patients.reduce((acc, curr) => acc + (curr.visitCount || 0), 0)}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Sessions</p>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                            <Calendar size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{new Date().toLocaleDateString()}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Date</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
                    <Search className="text-gray-400 ml-4" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        className="flex-1 p-2 outline-none font-medium text-slate-700 placeholder:text-gray-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Patients Grid */}
                {filteredPatients.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                            <Users size={32} />
                        </div>
                        <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">No Patients Found</h3>
                        <p className="text-gray-400 font-medium mt-2">Patients will appear here once they have appointments with you.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPatients.map(patient => (
                            <div
                                key={patient.id}
                                onClick={() => setSelectedPatient(patient)}
                                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-100 transition-all group cursor-pointer"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-xl font-black text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                        {patient.name?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{patient.name}</h3>
                                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full mt-1 inline-block">
                                            {patient.age} Years • {patient.gender || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                        <Phone size={16} className="text-gray-300" />
                                        {patient.phone || 'No phone'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                        <Mail size={16} className="text-gray-300" />
                                        {patient.email || 'No email'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                        <Activity size={16} className="text-gray-300" />
                                        {patient.visitCount} Sessions Completed
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Last Visit</span>
                                    <span className="text-sm font-bold text-slate-700">{patient.lastVisit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Patient Details Modal */}
            {selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4a2b3d]/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center text-3xl font-black text-orange-600">
                                    {selectedPatient.name?.[0]}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">{selectedPatient.name}</h2>
                                    <p className="text-slate-400 font-bold">{selectedPatient.age} Years • {selectedPatient.gender}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                                <FileText size={20} /> {/* Placeholder for close icon or similar */}
                                <span className="sr-only">Close</span>
                                X
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-2xl">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Contact Details</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-500">Phone</span>
                                        <span className="text-sm font-black text-slate-700">{selectedPatient.phone}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-500">Email</span>
                                        <span className="text-sm font-black text-slate-700">{selectedPatient.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        // createChat(selectedPatient.id);
                                        toast.success('Chat feature coming soon');
                                    }}
                                    className="flex-1 py-4 bg-[#4a2b3d] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5d354d] transition-all"
                                >
                                    Message
                                </button>
                                <button
                                    onClick={() => {
                                        router.push(`/physiotherapist/patients/${selectedPatient.id}`);
                                    }}
                                    className="flex-1 py-4 bg-orange-50 text-orange-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-100 transition-all"
                                >
                                    View Full History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
