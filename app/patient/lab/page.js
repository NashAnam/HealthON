'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getVerifiedLabs, createLabBooking, getLabBookings } from '@/lib/supabase';
import { FlaskConical, Search, Calendar, FileText, ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [labs, setLabs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [bookingData, setBookingData] = useState({
    test_type: '',
    test_date: '',
    home_collection: false,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLabs();
  }, [labs, searchTerm, locationSearch]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return router.push('/login');

      const [patientData, labsData, bookingsData] = await Promise.all([
        getPatient(user.id).then(res => res.data),
        getVerifiedLabs().then(res => res.data),
        getLabBookings(user.id).then(res => res.data)
      ]);

      setPatient(patientData);
      setLabs(labsData || []);
      setFilteredLabs(labsData || []);
      setMyBookings(bookingsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load labs');
    } finally {
      setLoading(false);
    }
  };

  const filterLabs = () => {
    let filtered = labs;

    if (searchTerm) {
      filtered = filtered.filter(lab =>
        lab.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationSearch) {
      filtered = filtered.filter(lab =>
        lab.address?.toLowerCase().includes(locationSearch.toLowerCase())
      );
    }

    setFilteredLabs(filtered);
  };

  const handleBookTest = async () => {
    if (!bookingData.test_type) {
      toast.error('Please select a test type');
      return;
    }
    if (!bookingData.test_date) {
      toast.error('Please select a test date');
      return;
    }

    try {
      await createLabBooking({
        patient_id: patient.user_id,
        lab_id: selectedLab.id,
        ...bookingData,
        status: 'pending'
      });

      toast.success('Lab test booked successfully!');
      setShowBookingForm(false);
      setSelectedLab(null);
      setBookingData({ test_type: '', test_date: '', home_collection: false, notes: '' });
      loadData();
    } catch (error) {
      console.error('Error booking test:', error);
      toast.error('Error booking test: ' + error.message);
    }
  };

  const commonTests = [
    { name: 'Complete Blood Count (CBC)', price: 15 },
    { name: 'Lipid Profile', price: 25 },
    { name: 'Liver Function Test (LFT)', price: 30 },
    { name: 'Thyroid Profile (T3, T4, TSH)', price: 40 },
    { name: 'HbA1c (Diabetes)', price: 20 },
    { name: 'Vitamin D Total', price: 35 },
    { name: 'Comprehensive Full Body Checkup', price: 99 },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plum-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/patient/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lab Tests & Diagnostics</h1>
              <p className="text-sm text-gray-500">Book healthy checkups near you</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">

        {/* My Bookings Preview */}
        {myBookings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {myBookings.slice(0, 2).map((booking) => (
                <div key={booking.id} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{booking.labs?.name || 'Lab Partner'}</p>
                    <p className="text-xs text-gray-500">{booking.test_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-plum-700 bg-plum-50 px-2 py-1 rounded-lg capitalize">{booking.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search labs, tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500 transition-all font-medium"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Location (e.g. Downtown)"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Labs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No labs found</p>
            </div>
          ) : (
            filteredLabs.map((lab) => (
              <div
                key={lab.id}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-plum-100 transition-all group"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg shadow-teal-500/20">
                    {lab.name?.charAt(0) || 'L'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-teal-700 transition-colors">{lab.name}</h3>
                    {lab.verified && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Check className="w-3.5 h-3.5 text-teal-500" />
                        <span className="text-xs text-gray-500 font-medium">Verified Partner</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    Tests starting from <span className="font-bold text-gray-900">$15</span>
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    Home Collection Available
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedLab(lab);
                    setShowBookingForm(true);
                  }}
                  className="w-full bg-teal-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                >
                  Book Test
                </button>
              </div>
            ))
          )}
        </div>

        {/* Booking Modal */}
        {showBookingForm && selectedLab && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowBookingForm(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">Book Lab Test</h2>
                <p className="text-sm text-gray-500">{selectedLab.name}</p>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Test</label>
                  <select
                    value={bookingData.test_type}
                    onChange={(e) => setBookingData({ ...bookingData, test_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none font-medium bg-white"
                  >
                    <option value="">Choose a test...</option>
                    {commonTests.map(test => (
                      <option key={test.name} value={test.name}>
                        {test.name} - ${test.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Date</label>
                  <input
                    type="date"
                    value={bookingData.test_date}
                    onChange={(e) => setBookingData({ ...bookingData, test_date: e.target.value })}
                    min={new Date().toLocaleDateString('en-CA')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm font-medium"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Home Collection</p>
                    <p className="text-xs text-gray-500">Sample picked from your home</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookingData.home_collection}
                      onChange={(e) => setBookingData({ ...bookingData, home_collection: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Notes</label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    placeholder="Instructions..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
                    rows="2"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowBookingForm(false);
                      setSelectedLab(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookTest}
                    className="flex-1 bg-teal-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
                  >
                    Confirm Booking
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