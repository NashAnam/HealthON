'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getLab, supabase, signOut } from '@/lib/supabase';
import { FlaskConical, Calendar, FileText, Upload, Users, TrendingUp, LogOut, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabDashboard() {
  const router = useRouter();
  const [lab, setLab] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    total: 0
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: labData } = await getLab(user.id);
    if (!labData) {
      router.push('/complete-profile');
      return;
    }
    setLab(labData);

    // Get lab bookings
    const { data: bookingsData } = await supabase
      .from('lab_bookings')
      .select(`
        *,
        patients (*)
      `)
      .eq('lab_id', labData.id)
      .order('test_date', { ascending: false });

    setBookings(bookingsData || []);

    // Calculate stats
    const pending = (bookingsData || []).filter(b => b.status === 'pending').length;
    const completed = (bookingsData || []).filter(b => b.status === 'completed').length;

    setStats({
      pending,
      completed,
      total: (bookingsData || []).length
    });
  };

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Logout failed. Please try again.');
        return;
      }
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Lab logout error:', error);
      toast.error('Logout failed. Please try again.');
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.replace('/login');
      }
    }
  };

  if (!lab) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
      <div className="text-center">
        <FlaskConical className="w-12 h-12 text-emerald-600 animate-pulse mx-auto mb-4" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-emerald-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                <FlaskConical className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CareOn</h1>
                <p className="text-sm text-gray-600">Lab Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">{lab.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-emerald-600">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600 mt-1">Test Bookings</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-yellow-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-yellow-600">Pending</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-sm text-gray-600 mt-1">To Process</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-600">Completed</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            <p className="text-sm text-gray-600 mt-1">Tests Done</p>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Bookings</h2>
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No test bookings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-5 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                        {booking.patients?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{booking.patients?.name || 'Patient'}</h3>
                        <p className="text-sm text-gray-600 mt-1">{booking.test_type}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {booking.test_date}
                          </div>
                          {booking.patients?.phone && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {booking.patients.phone}
                            </div>
                          )}
                        </div>
                        {booking.notes && (
                          <p className="text-sm text-gray-700 mt-2">
                            <span className="font-semibold">Notes:</span> {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {booking.status}
                      </span>
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => toast.success('Upload report feature coming soon!')}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-emerald-100 to-blue-100 p-6 rounded-2xl border border-emerald-200">
          <div className="flex items-start gap-4">
            <FileText className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Lab Management Tips</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Process pending test bookings promptly</li>
                <li>• Upload test results in digital format</li>
                <li>• Maintain accurate patient records</li>
                <li>• Notify patients when reports are ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}