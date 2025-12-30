'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getReminders, createReminder, updateReminder, supabase } from '@/lib/supabase';
import { Bell, Plus, Clock, Pill, Calendar as CalendarIcon, Activity, ArrowLeft, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, scheduleNotification, showInstantNotification } from '@/lib/notifications';

export default function RemindersPage() {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    reminder_type: 'medication',
    title: '',
    description: '',
    reminder_time: '',
    dosage: '',
    frequency: 'daily',
    reminder_date: ''
  });
  const [selectedReminder, setSelectedReminder] = useState(null);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: patientData } = await getPatient(user.id);
      if (!patientData) return;
      setPatient(patientData);

      const pid = patientData.id;

      // Fetch manual reminders (including meds)
      const { data: remindersData } = await getReminders(pid);

      // Fetch upcoming doctor appointments
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('*, doctors(name)')
        .eq('patient_id', pid)
        .eq('status', 'confirmed')
        .gte('appointment_date', new Date().toISOString().split('T')[0]);

      // Fetch upcoming lab bookings
      const { data: labData } = await supabase
        .from('lab_bookings')
        .select('*, labs(name)')
        .eq('patient_id', pid)
        .neq('status', 'cancelled')
        .gte('test_date', new Date().toISOString().split('T')[0]);

      const manualReminders = (remindersData || []).map(r => ({
        ...r,
        source: 'manual'
      }));

      const appointmentReminders = (appointmentData || []).map(a => ({
        id: `apt-${a.id}`,
        title: `Appointment with Dr. ${a.doctors?.name || 'Specialist'}`,
        description: `Type: ${a.consultation_type || 'General'}`,
        reminder_time: a.appointment_time || 'Check Details',
        frequency: new Date(a.appointment_date).toLocaleDateString(),
        reminder_type: 'appointment',
        is_active: true,
        source: 'appointment'
      }));

      const labReminders = (labData || []).map(l => ({
        id: `lab-${l.id}`,
        title: `Lab Test: ${l.test_type}`,
        description: `Lab: ${l.labs?.name || 'Diagnostic Center'}`,
        reminder_time: 'Scheduled Date',
        frequency: new Date(l.test_date).toLocaleDateString(),
        reminder_type: 'health_check',
        is_active: true,
        source: 'lab'
      }));

      setReminders([...manualReminders, ...appointmentReminders, ...labReminders]);
    } catch (error) {
      console.error('Error loading reminders:', error);
      toast.error('Failed to load all reminders');
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.reminder_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        patient_id: patient.id,
        ...newReminder,
        is_active: true
      };

      // Ensure reminder_date is only sent if frequency is specific to avoid potential schema issues
      if (newReminder.frequency !== 'specific') {
        delete payload.reminder_date;
      }

      await createReminder(payload);

      // Schedule local notification
      try {
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          const [hours, minutes] = newReminder.reminder_time.split(':');
          const scheduleDate = new Date(newReminder.frequency === 'specific' ? newReminder.reminder_date : new Date());
          scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          if (scheduleDate < new Date() && newReminder.frequency !== 'specific') {
            scheduleDate.setDate(scheduleDate.getDate() + 1);
          }

          if (scheduleDate >= new Date()) {
            await scheduleNotification(
              newReminder.title,
              newReminder.description || `Time for your ${newReminder.reminder_type} reminder`,
              scheduleDate.toISOString()
            );
          }
        }
      } catch (notifyError) {
        console.error('Failed to schedule notification:', notifyError);
      }

      toast.success('Reminder created successfully!');
      setShowAddForm(false);
      setNewReminder({
        reminder_type: 'medication',
        title: '',
        description: '',
        reminder_time: '',
        frequency: 'daily',
        reminder_date: ''
      });
      loadReminders();
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error('Error creating reminder: ' + error.message);
    }
  };

  const handleToggleReminder = async (reminderId, currentStatus) => {
    try {
      await updateReminder(reminderId, { is_active: !currentStatus });
      toast.success(currentStatus ? 'Reminder disabled' : 'Reminder enabled');
      loadReminders();
    } catch (error) {
      toast.error('Error updating reminder: ' + error.message);
    }
  };

  const getReminderIcon = (type) => {
    switch (type) {
      case 'medication': return <Pill className="w-5 h-5" />;
      case 'appointment': return <CalendarIcon className="w-5 h-5" />;
      case 'health_check': return <Activity className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getReminderColor = (type) => {
    switch (type) {
      case 'medication': return 'from-blue-500 to-indigo-600';
      case 'appointment': return 'from-green-500 to-emerald-600';
      case 'health_check': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!patient) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <p className="text-gray-600">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 w-full">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/patient/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
              <p className="text-sm text-gray-600">Manage your health reminders</p>
            </div>
            <button
              onClick={async () => {
                const hasPermission = await requestNotificationPermission();
                if (hasPermission) {
                  showInstantNotification('🔔 HealthON Test', 'Your notifications are working perfectly!');
                } else {
                  toast.error('Permission denied. Please enable notifications in your browser settings.');
                }
              }}
              className="ml-auto text-xs font-black uppercase tracking-widest text-plum-600 bg-plum-50 px-4 py-2 rounded-lg border border-plum-100 hover:bg-plum-100 transition-all"
            >
              Test Notifications
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Add Reminder Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Reminder
          </button>
        </div>

        {/* Add Reminder Form */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Reminder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reminder Type</label>
                <select
                  value={newReminder.reminder_type}
                  onChange={(e) => setNewReminder({ ...newReminder, reminder_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="medication">Medication</option>
                  <option value="appointment">Appointment</option>
                  <option value="health_check">Health Check</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    placeholder="e.g., Take Multivitamin"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dosage (Optional)</label>
                  <input
                    type="text"
                    value={newReminder.dosage}
                    onChange={(e) => setNewReminder({ ...newReminder, dosage: e.target.value })}
                    placeholder="e.g., 500mg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={newReminder.description}
                  onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                  placeholder="Additional details..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={newReminder.reminder_time}
                    onChange={(e) => setNewReminder({ ...newReminder, reminder_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                  <select
                    value={newReminder.frequency}
                    onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="specific">Specific Date</option>
                  </select>
                </div>
              </div>

              {newReminder.frequency === 'specific' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    value={newReminder.reminder_date}
                    onChange={(e) => setNewReminder({ ...newReminder, reminder_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    min={new Date().toLocaleDateString('en-CA')}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddReminder}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Reminder
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Reminders</h2>
          {reminders.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No reminders set</p>
              <p className="text-sm text-gray-500 mt-2">Create your first reminder to stay on track</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  onClick={() => setSelectedReminder(reminder)}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${reminder.is_active ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getReminderColor(reminder.reminder_type)} flex items-center justify-center text-white flex-shrink-0`}>
                        {getReminderIcon(reminder.reminder_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          {reminder.title}
                          {reminder.dosage && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">{reminder.dosage}</span>}
                        </h3>
                        {reminder.description && (
                          <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {reminder.reminder_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {reminder.frequency === 'specific' ? reminder.reminder_date : reminder.frequency}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {reminder.source === 'manual' ? (
                        <button
                          onClick={() => handleToggleReminder(reminder.id, reminder.is_active)}
                          className={`p-2 rounded-lg transition-colors ${reminder.is_active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          title={reminder.is_active ? 'Disable reminder' : 'Enable reminder'}
                        >
                          {reminder.is_active ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                          Auto-Sync
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-start gap-4">
            <Bell className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Stay on Track</h3>
              <p className="text-sm text-gray-700">
                Set reminders for medications, appointments, and health checks to maintain your wellness routine. You'll receive notifications at the scheduled times.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}