'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getPatient, getReminders, createReminder, updateReminder } from '@/lib/supabase';
import { Bell, Plus, Clock, Pill, Calendar as CalendarIcon, Activity, ArrowLeft, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

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
    frequency: 'daily'
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
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

    const { data: remindersData } = await getReminders(patientData.id);
    setReminders(remindersData || []);
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.reminder_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createReminder({
        patient_id: patient.id,
        ...newReminder,
        is_active: true
      });

      toast.success('Reminder created successfully!');
      setShowAddForm(false);
      setNewReminder({
        reminder_type: 'medication',
        title: '',
        description: '',
        reminder_time: '',
        frequency: 'daily'
      });
      loadReminders();
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder="e.g., Take Blood Pressure Medication"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
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
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

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
                  className={`p-5 rounded-xl border-2 transition-all ${reminder.is_active ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getReminderColor(reminder.reminder_type)} flex items-center justify-center text-white flex-shrink-0`}>
                        {getReminderIcon(reminder.reminder_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900">{reminder.title}</h3>
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
                            {reminder.frequency}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleReminder(reminder.id, reminder.is_active)}
                        className={`p-2 rounded-lg transition-colors ${reminder.is_active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        title={reminder.is_active ? 'Disable reminder' : 'Enable reminder'}
                      >
                        {reminder.is_active ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </button>
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