'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, supabase } from '@/lib/supabase';
import { ArrowLeft, FlaskConical, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabBookingPage() {
    const router = useRouter();
    const [patient, setPatient] = useState(null);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLab, setSelectedLab] = useState(null);
    const [bookingData, setBookingData] = useState({
        test_type: '',
        test_date: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const user = await getCurrentUser();
        if (!user) return router.push('/login');

        const { data: patientData } = await getPatient(user.id);
        if (!patientData) return;
        setPatient(patientData);

        // Fetch labs
        const { data: labsData } = await supabase
            .from('labs')
            .select('*')
            .eq('verified', true);

        setLabs(labsData || []);
        setLoading(false);
    };

    const handleBooking = async () => {
        if (!selectedLab || !bookingData.test_type || !bookingData.test_date) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            const { error } = await supabase.from('lab_bookings').insert({
                patient_id: patient.id,
                lab_id: selectedLab.id,
                test_type: bookingData.test_type,
                test_date: bookingData.test_date,
                notes: bookingData.notes,
                status: 'pending'
            });

            if (error) throw error;

            toast.success('Lab test booked successfully!');
            router.push('/patient/reports');
        } catch (error) {
            console.error('Booking error:', error);
            toast.error('Failed to book lab test');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]"><div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-20">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="container mx-auto px-6 py-5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-900" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">Book Lab Test</h1>
                            <p className="text-sm font-bold text-gray-400">Schedule your diagnostic tests</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 max-w-4xl">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-gray-900 mb-6">Test Details</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Test Type *</label>
                            <input
                                type="text"
                                value={bookingData.test_type}
                                onChange={(e) => setBookingData({ ...bookingData, test_type: e.target.value })}
                                placeholder="e.g., Blood Test, X-Ray, MRI"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Date *</label>
                            <input
                                type="date"
                                value={bookingData.test_date}
                                onChange={(e) => setBookingData({ ...bookingData, test_date: e.target.value })}
                                min={new Date().toLocaleDateString('en-CA')}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Select Lab *</label>
                            <div className="grid md:grid-cols-2 gap-4">
                                {labs.length === 0 ? (
                                    <p className="text-gray-500 col-span-2 text-center py-8">No labs available</p>
                                ) : (
                                    labs.map((lab) => (
                                        <div
                                            key={lab.id}
                                            onClick={() => setSelectedLab(lab)}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedLab?.id === lab.id
                                                ? 'border-teal-600 bg-teal-50'
                                                : 'border-gray-200 hover:border-teal-300'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                                    <FlaskConical className="w-5 h-5 text-teal-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900">{lab.name}</h3>
                                                    {lab.address && (
                                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {lab.address}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Additional Notes</label>
                            <textarea
                                value={bookingData.notes}
                                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                placeholder="Any special instructions or requirements..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[100px] resize-none"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => router.back()}
                                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBooking}
                                className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                            >
                                Book Test
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
