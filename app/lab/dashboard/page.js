'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getLab, supabase, signOut } from '@/lib/supabase';
import { FlaskConical, Calendar, FileText, Upload, Users, TrendingUp, LogOut, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabDashboard() {
  const router = useRouter();
  const [lab, setLab] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, total: 0 });
  const [uploading, setUploading] = useState(null);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    const user = await getCurrentUser();
    if (!user) return router.push('/login');
    const { data: labData } = await getLab(user.id);
    if (!labData) return router.push('/complete-profile');
    setLab(labData);

    const { data: bookingsData } = await supabase
      .from('lab_bookings')
      .select('*, patients (*)')
      .eq('lab_id', labData.id)
      .order('test_date', { ascending: false });

    setBookings(bookingsData || []);
    setStats({
      pending: (bookingsData || []).filter(b => b.status === 'pending').length,
      completed: (bookingsData || []).filter(b => b.status === 'completed').length,
      total: (bookingsData || []).length
    });
  };

  const handleFileUpload = async (e, bookingId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(bookingId);
    try {
      // Mock upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update booking status
      const { error } = await supabase
        .from('lab_bookings')
        .update({
          status: 'completed',
          // report_url: 'mock_url_to_pdf' // Uncomment if column exists
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Report uploaded & sent to patient!');
      loadDashboard();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload report');
    } finally {
      setUploading(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!lab) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div></div>;

  if (lab && !lab.verified) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Dynamic Background Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-50/30 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-plum-50/40 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-xl w-full text-center relative z-10 space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-xl border border-teal-100 flex items-center justify-center mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-teal-50 opacity-10 group-hover:opacity-20 transition-opacity" />
            <Clock className="w-12 h-12 text-teal-600 animate-pulse" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">
              Lab Verification <span className="text-teal-600">Pending</span>
            </h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              Hello, <span className="text-teal-700 font-bold">{lab.name}</span>! Your laboratory profile is currently being verified by our network administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 text-left">
            {[
              { text: "Facility compliance check", status: "Ongoing" },
              { text: "Laboratory certification review", status: "Ongoing" },
              { text: "Security and data protocol audit", status: "Ongoing" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                    <FlaskConical className="w-4 h-4 text-teal-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{item.text}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] leading-loose">
            You will receive access to test bookings and <br /> report management once verified.
          </p>

          <button
            onClick={handleLogout}
            className="px-10 py-4 bg-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-teal-700/20"
          >
            Logout to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 fixed top-0 w-full z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg">
              <FlaskConical className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-plum-800">HealthOn Lab</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-700">{lab.name}</span>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-28 pb-10">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <StatCard icon={FileText} label="Total Bookings" value={stats.total} color="teal" />
          <StatCard icon={Clock} label="Pending Tests" value={stats.pending} color="amber" />
          <StatCard icon={CheckCircle} label="Allocated Reports" value={stats.completed} color="green" />
        </div>

        {/* Bookings List */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl border border-white/50 shadow-xl overflow-hidden p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Bookings</h2>

          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-lg">
                    {booking.patients?.name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{booking.patients?.name}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                      <span className="font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{booking.test_type}</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {booking.test_date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  {booking.status === 'completed' ? (
                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-xl">
                      <CheckCircle size={18} /> Report Sent
                    </div>
                  ) : (
                    <div className="relative w-full md:w-auto">
                      <input
                        type="file"
                        id={`file-${booking.id}`}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, booking.id)}
                      />
                      <label
                        htmlFor={`file-${booking.id}`}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 bg-plum-600 text-white font-bold rounded-xl cursor-pointer hover:bg-plum-700 transition-all shadow-lg shadow-plum-600/20 ${uploading === booking.id ? 'opacity-70 pointer-events-none' : ''}`}
                      >
                        <Upload size={18} />
                        {uploading === booking.id ? 'Uploading...' : 'Upload Report'}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-center text-gray-500 py-8">No bookings found.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700'
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={24} /></div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}