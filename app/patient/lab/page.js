'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getVerifiedLabs, createLabBooking, getLabBookings } from '@/lib/supabase';
import { FlaskConical, Search, Calendar, FileText, ArrowLeft, Check, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { notifyLabTestBooked } from '@/lib/appointmentNotifications';

export default function LabPage() {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [labs, setLabs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLab, setSelectedLab] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    test_date: new Date().toISOString().split('T')[0],
    test_type: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLabs();
  }, [labs, searchTerm]);

  const loadData = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: patientData } = await getPatient(user.id);
    if (!patientData) {
      router.push('/complete-profile');
      return;
    }
    setPatient(patientData);

    const { data: labsData } = await getVerifiedLabs();
    setLabs(labsData || []);

    const { data: bookingsData } = await getLabBookings(patientData.id);
    setMyBookings(bookingsData || []);
  };

  const filterLabs = () => {
    if (!searchTerm) {
      setFilteredLabs(labs);
      return;
    }

    const filtered = labs.filter(lab =>
      lab.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLabs(filtered);
  };

  const handleBookTest = async () => {
    if (!bookingData.test_type) {
      toast.error('Please select a test type');
      return;
    }

    try {
      await createLabBooking({
        patient_id: patient.id,
        lab_id: selectedLab.id,
        ...bookingData,
        status: 'pending'
      });

      // Send notification
      notifyLabTestBooked(bookingData, selectedLab);

      toast.success('Lab test booked successfully!');
      setShowBookingForm(false);
      setSelectedLab(null);
      loadData();
    } catch (error) {
      toast.error('Error booking test: ' + error.message);
    }
  };

  const commonTests = [
    'Complete Blood Count (CBC)',
    'Lipid Profile',
    'Liver Function Test (LFT)',
    'Kidney Function Test (KFT)',
    'Thyroid Profile',
    'Blood Sugar (Fasting)',
    'HbA1c',
    'Vitamin D',
    'Vitamin B12',
    'Urine Routine'
  ];

  if (!patient) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
      <p className="text-gray-600">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-emerald-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/patient/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lab Tests</h1>
              <p className="text-sm text-gray-600">Book lab tests and view reports</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* My Bookings */}
        {myBookings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Lab Bookings</h2>
            <div className="space-y-4">
              {myBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{booking.labs?.name || 'Lab'}</h3>
                      <p className="text-sm text-gray-600 mt-1">{booking.test_type}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {booking.test_date}
                        </div>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search labs by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Labs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
              <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No labs found</p>
            </div>
          ) : (
            filteredLabs.map((lab) => (
              <div
                key={lab.id}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {lab.name?.charAt(0) || 'L'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{lab.name}</h3>
                    {lab.verified && (
                      <div className="flex items-center gap-1 mt-1">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs text-emerald-600 font-semibold">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {lab.address && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{lab.address}</p>
                )}

                {lab.phone && (
                  <p className="text-sm text-gray-700 mb-4">
                    <span className="font-semibold">Phone:</span> {lab.phone}
                  </p>
                )}

                <button
                  onClick={() => {
                    setSelectedLab(lab);
                    setShowBookingForm(true);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Book Test
                </button>
              </div>
            ))
          )}
        </div>

        {/* Booking Modal */}
        {showBookingForm && selectedLab && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowBookingForm(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Book Lab Test</h2>
                <p className="text-gray-600">{selectedLab.name}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Test Date</label>
                  <input
                    type="date"
                    value={bookingData.test_date}
                    onChange={(e) => setBookingData({ ...bookingData, test_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Test Type</label>
                  <select
                    value={bookingData.test_type}
                    onChange={(e) => setBookingData({ ...bookingData, test_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select a test</option>
                    {commonTests.map(test => (
                      <option key={test} value={test}>{test}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    placeholder="Any special instructions or requirements..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleBookTest}
                    className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => {
                      setShowBookingForm(false);
                      setSelectedLab(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}