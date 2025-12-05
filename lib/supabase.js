import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only throw error if we're in the browser and env vars are missing
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ---------------------- AUTH ----------------------

export const signInWithGoogle = async () => {
  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/complete-profile`
    : '/complete-profile';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// ---------------------- PATIENTS ----------------------

export const createPatient = async (patientData) => {
  console.log('[SUPABASE] Creating patient with data:', patientData);
  const { data, error } = await supabase
    .from("patients")
    .insert([patientData])
    .select()
    .single();

  console.log('[SUPABASE] Create patient result:', { data, error });
  return { data, error };
};

export const updatePatient = async (userId, updates) => {
  // First get the most recent patient record
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!patient) {
    return { data: null, error: { message: "Patient not found" } };
  }

  // Update by ID to ensure we only update one record
  const { data, error } = await supabase
    .from("patients")
    .update(updates)
    .eq("id", patient.id)
    .select()
    .single();

  return { data, error };
};

export const getPatient = async (userId) => {
  console.log('[SUPABASE] Getting patient for user_id:', userId);
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[SUPABASE] Get patient ERROR:', error.message, error);
  } else {
    console.log('[SUPABASE] Get patient SUCCESS:', data);
  }
  return { data, error };
};

// ---------------------- DOCTORS ----------------------

export const createDoctor = async (doctorData) => {
  const { data, error } = await supabase
    .from("doctors")
    .insert([doctorData])
    .select()
    .single();

  return { data, error };
};

export const getDoctor = async (userId) => {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { data, error };
};

export const getVerifiedDoctors = async () => {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
};

export const getDoctorPatients = async (doctorId) => {
  const { data, error } = await supabase
    .from("appointments")
    .select(`*, patients (*)`)
    .eq("doctor_id", doctorId);

  return { data, error };
};

// ---------------------- LABS ----------------------

export const createLab = async (labData) => {
  const { data, error } = await supabase
    .from("labs")
    .insert([labData])
    .select()
    .single();

  return { data, error };
};

export const getLab = async (userId) => {
  const { data, error } = await supabase
    .from("labs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { data, error };
};

export const getVerifiedLabs = async () => {
  const { data, error } = await supabase
    .from("labs")
    .select("*")
    .eq("verified", true)
    .order("created_at", { ascending: false });

  return { data, error };
};

// ---------------------- HEALTH TRACKER ----------------------

export const addHealthData = async (healthData) => {
  const { data, error } = await supabase
    .from("health_tracker")
    .insert([healthData])
    .select()
    .single();

  return { data, error };
};

export const getHealthData = async (patientId, days = 7) => {
  const { data, error } = await supabase
    .from("health_tracker")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false })
    .limit(days);

  return { data, error };
};

// ---------------------- LAB BOOKINGS ----------------------

export const createLabBooking = async (bookingData) => {
  const { data, error } = await supabase
    .from("lab_bookings")
    .insert([bookingData])
    .select()
    .single();

  return { data, error };
};

export const getLabBookings = async (patientId) => {
  const { data, error } = await supabase
    .from("lab_bookings")
    .select(`*, labs (*)`)
    .eq("patient_id", patientId);

  return { data, error };
};

// ---------------------- LAB REPORTS ----------------------

export const uploadLabReport = async (reportData) => {
  const { data, error } = await supabase
    .from("lab_reports")
    .insert([reportData])
    .select()
    .single();

  return { data, error };
};

export const getLabReports = async (patientId) => {
  const { data, error } = await supabase
    .from("lab_reports")
    .select("*")
    .eq("patient_id", patientId)
    .order("test_date", { ascending: false });

  return { data, error };
};

// ---------------------- APPOINTMENTS ----------------------

export const createAppointment = async (appointmentData) => {
  const { data, error } = await supabase
    .from("appointments")
    .insert([appointmentData])
    .select()
    .single();

  return { data, error };
};

export const getPatientAppointments = async (patientId) => {
  const { data, error } = await supabase
    .from("appointments")
    .select(`*, doctors (*)`)
    .eq("patient_id", patientId);

  return { data, error };
};

export const getDoctorAppointments = async (doctorId) => {
  const { data, error } = await supabase
    .from("appointments")
    .select(`*, patients (*)`)
    .eq("doctor_id", doctorId);

  return { data, error };
};

// ---------------------- REMINDERS (Update) ----------------------

export const updateReminder = async (reminderId, updates) => {
  const { data, error } = await supabase
    .from("reminders")
    .update(updates)
    .eq("id", reminderId)
    .select()
    .single();

  return { data, error };
};

// ---------------------- PAYMENTS ----------------------

export const createPayment = async (paymentData) => {
  const { data, error } = await supabase
    .from("payments")
    .insert([paymentData])
    .select()
    .single();

  return { data, error };
};

export const updatePaymentStatus = async (
  paymentId,
  status,
  transactionId
) => {
  const { data, error } = await supabase
    .from("payments")
    .update({
      payment_status: status,
      transaction_id: transactionId,
    })
    .eq("id", paymentId)
    .select()
    .single();

  return { data, error };
};

// ---------------------- SUBSCRIPTION ----------------------

export const checkSubscriptionStatus = async (userId) => {
  const { data: patient, error } = await supabase
    .from("patients")
    .select("subscription_end_date")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !patient) {
    return { isActive: false, endDate: null };
  }

  const endDate = patient.subscription_end_date ? new Date(patient.subscription_end_date) : null;
  const isActive = endDate && endDate > new Date();

  return { isActive, endDate };
};

// ---------------------- HEALTH ASSESSMENTS ----------------------

export const saveAssessment = async (patientId, answers, scores) => {
  const { data, error } = await supabase
    .from('health_assessments')
    .insert([{ patient_id: patientId, answers, scores }])
    .select()
    .single();
  return { data, error };
};

export const getLatestAssessment = async (patientId) => {
  const { data, error } = await supabase
    .from('health_assessments')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
};

// ---------------------- VITALS ----------------------

export const saveVitals = async (patientId, vitals) => {
  const { data, error } = await supabase
    .from('vitals')
    .insert([{ patient_id: patientId, ...vitals }])
    .select()
    .single();
  return { data, error };
};

export const getLatestVitals = async (patientId) => {
  const { data, error } = await supabase
    .from('vitals')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
};

// ---------------------- REMINDERS ----------------------

export const getReminders = async (patientId) => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('reminder_time', { ascending: true });
  return { data, error };
};

export const createReminder = async (reminder) => {
  const { data, error } = await supabase
    .from('reminders')
    .insert([reminder])
    .select()
    .single();
  return { data, error };
};

