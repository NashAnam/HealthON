'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getDoctor, getDoctorPatients, supabase } from '@/lib/supabase';
import { Users, Search, Calendar, FileText, Activity, ArrowLeft, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientsPage() {
    const router = useRouter();
    const [doctor, setDoctor] = useState(null);
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        loadPatients();
    }, []);

    useEffect(() => {
        filterPatients();
    }, [patients, searchTerm]);

    const loadPatients = async () => {
        const user = await getCurrentUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: doctorData } = await getDoctor(user.id);
        if (!doctorData) {
            router.push('/complete-profile');
            return;
        }
        setDoctor(doctorData);

        // Try getting assigned patients first
        let { data: patientsData } = await getDoctorPatients(doctorData.id);

        let uniquePatients = [];
        const patientIds = new Set();

        if (patientsData && patientsData.length > 0) {
            (patientsData || []).forEach(apt => {
                if (apt.patients && !patientIds.has(apt.patients.id)) {
                    patientIds.add(apt.patients.id);
                    uniquePatients.push({
                        ...apt.patients,
                        lastVisit: apt.appointment_date,
                        appointmentCount: (patientsData || []).filter(a => a.patient_id === apt.patients.id).length
                    });
                }
            });
        } else {
            // Fallback: Fetch ALL patients for directory view if no appointments exist
            const { data: allPatients } = await supabase.from('patients').select('*');
            if (allPatients) {
                uniquePatients = allPatients.map(p => ({
                    ...p,
                    lastVisit: 'No visits yet',
                    appointmentCount: 0
                }));
            }
        }

        setPatients(uniquePatients);
    };

    const filterPatients = () => {
        if (!searchTerm) {
            setFilteredPatients(patients);
            return;
        }

        const filtered = patients.filter(patient =>
            patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.phone?.includes(searchTerm) ||
            patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPatients(filtered);
    };

    if (!doctor) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
            <p className="text-gray-600">Loading...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-indigo-100">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/doctor/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
                            <p className="text-sm text-gray-600">View and manage patient information</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Patients</p>
                                <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Cases</p>
                                <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Records</p>
                                <p className="text-3xl font-bold text-gray-900">{patients.reduce((sum, p) => sum + (p.appointmentCount || 0), 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patients by name, phone, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Patients List */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">All Patients</h2>
                    {filteredPatients.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">No patients found</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {filteredPatients.map((patient) => (
                                <div
                                    key={patient.id}
                                    className="p-5 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => setSelectedPatient(patient)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                                            {patient.name?.charAt(0) || 'P'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 truncate">{patient.name}</h3>
                                            <div className="space-y-1 mt-2">
                                                {patient.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone className="w-4 h-4 flex-shrink-0" />
                                                        <span className="truncate">{patient.phone}</span>
                                                    </div>
                                                )}
                                                {patient.email && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Mail className="w-4 h-4 flex-shrink-0" />
                                                        <span className="truncate">{patient.email}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                                    <span>Last visit: {patient.lastVisit || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                                    {patient.appointmentCount || 0} visits
                                                </span>
                                                {patient.age && (
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                                        Age: {patient.age}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Patient Detail Modal */}
                {selectedPatient && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedPatient(null)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-3xl">
                                        {selectedPatient.name?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified HealthON Patient</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Contact Information</h3>
                                    <div className="space-y-2">
                                        {selectedPatient.phone && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Phone className="w-5 h-5 text-indigo-600" />
                                                <span>{selectedPatient.phone}</span>
                                            </div>
                                        )}
                                        {selectedPatient.email && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Mail className="w-5 h-5 text-indigo-600" />
                                                <span>{selectedPatient.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Medical Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-600">Age</p>
                                            <p className="text-lg font-bold text-gray-900">{selectedPatient.age || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-600">Total Visits</p>
                                            <p className="text-lg font-bold text-gray-900">{selectedPatient.appointmentCount || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedPatient(null)}
                                    className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
