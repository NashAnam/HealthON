import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

export const createPatient = async (patientData) => {
  console.log('[SUPABASE] Creating/Updating patient with data:', patientData);
  const { data, error } = await supabase
    .from("patients")
    .upsert([patientData], { onConflict: 'user_id' })
    .select()
    .single();

  console.log('[SUPABASE] Create patient result:', { data, error });
  return { data, error };
};

export const getPatient = async (userId) => {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { data, error };
};

export const updatePatient = async (userId, updates) => {
  const { data, error } = await supabase
    .from("patients")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
};

export const acceptTerms = async (userId) => {
  const { data, error } = await supabase
    .from("patients")
    .update({ accepted_terms: true })
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
};

export const awardPoints = async (userId, points) => {
  // First get current points
  const { data: patient } = await supabase
    .from("patients")
    .select("reward_points")
    .eq("user_id", userId)
    .single();

  const currentPoints = patient?.reward_points || 0;

  const { data, error } = await supabase
    .from("patients")
    .update({ reward_points: currentPoints + points })
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
};

export const createDoctor = async (doctorData) => {
  const { data, error } = await supabase
    .from("doctors")
    .upsert([{ ...doctorData, verified: false }], { onConflict: 'user_id' })
    .select()
    .single();

  return { data, error };
};

export const getDoctor = async (userId) => {
  const { data, error } = await supabase
    .from("doctors")
    .select("id, user_id, name, specialty, address, fee, verified, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  return { data, error };
};

export const updateDoctor = async (userId, updates) => {
  const { data, error } = await supabase
    .from("doctors")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
};

export const getVerifiedDoctors = async () => {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("verified", true)
    .order("name", { ascending: true });

  return { data, error };
};

export const getDoctorPatients = async (doctorId) => {
  const { data, error } = await supabase
    .from("appointments")
    .select(`*, patients (*)`)
    .eq("doctor_id", doctorId);

  return { data, error };
};

export const getAllPatients = async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('*');
  return { data, error };
};

export const createLab = async (labData) => {
  const { data, error } = await supabase
    .from("labs")
    .upsert([{ ...labData, verified: false }], { onConflict: 'user_id' })
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

export const createAppointment = async (appointmentData) => {
  const { data, error } = await supabase
    .from("appointments")
    .insert([appointmentData])
    .select()
    .single();

  return { data, error };
};

export const getAppointments = async (patientId) => {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      doctors (*)
    `)
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false });

  return { data, error };
};

export const getPatientAppointments = getAppointments;

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
    .select(`
      *,
      labs (
        id,
        name,
        address
      )
    `)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  return { data, error };
};

export const getLabReports = async (patientId) => {
  const { data, error } = await supabase
    .from("lab_reports")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  return { data, error };
};

export const getLatestVitals = async (patientId) => {
  const { data, error } = await supabase
    .from("vitals")
    .select("*")
    .eq("patient_id", patientId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data, error };
};

export const createVitals = async (vitalsData) => {
  const { data, error } = await supabase
    .from("vitals")
    .insert([vitalsData])
    .select("*")
    .single();

  return { data, error };
};

export const saveAssessment = async (patientId, answers, scores) => {
  const { data, error } = await supabase
    .from("health_assessments")
    .insert([{
      patient_id: patientId,
      answers,
      scores
    }])
    .select()
    .single();

  return { data, error };
};

export const getLatestAssessment = async (patientId) => {
  const { data, error } = await supabase
    .from("health_assessments")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data, error };
};

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

export const updateReminder = async (reminderId, updates) => {
  const { data, error } = await supabase
    .from('reminders')
    .update(updates)
    .eq('id', reminderId)
    .select()
    .single();
  return { data, error };
};

export const createDietLog = async (dietData) => {
  const { data, error } = await supabase
    .from("diet_logs")
    .insert([dietData])
    .select()
    .single();
  return { data, error };
};

export const getDietLogs = async (patientId, startDate, endDate) => {
  let query = supabase
    .from("diet_logs")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false });

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const { data, error } = await query;
  return { data, error };
};

export const createSleepLog = async (sleepData) => {
  const { data, error } = await supabase
    .from("sleep_logs")
    .insert([sleepData])
    .select()
    .single();
  return { data, error };
};

export const getSleepLogs = async (patientId, startDate, endDate) => {
  let query = supabase
    .from("sleep_logs")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false });

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const { data, error } = await query;
  return { data, error };
};

export const createGoal = async (goalData) => {
  const { data, error } = await supabase
    .from("goals")
    .insert([goalData])
    .select()
    .single();
  return { data, error };
};

export const getGoals = async (patientId) => {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  return { data, error };
};

export const updateGoal = async (goalId, updates) => {
  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", goalId)
    .select()
    .single();
  return { data, error };
};

export const createProgressReport = async (reportData) => {
  const { data, error } = await supabase
    .from("progress_reports")
    .insert([reportData])
    .select()
    .single();
  return { data, error };
};

export const getProgressReports = async (patientId) => {
  const { data, error } = await supabase
    .from("progress_reports")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  return { data, error };
};

export const getDoctorAppointments = async (doctorId, date) => {
  let query = supabase
    .from("appointments")
    .select(`
      *,
      patients (*)
    `)
    .eq("doctor_id", doctorId)
    .order("appointment_time", { ascending: true });

  if (date) {
    query = query.eq("appointment_date", date);
  }

  const { data, error } = await query;
  return { data, error };
};

export const getPatientsByDoctor = async (doctorId) => {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      patient_id,
      patients (
        name,
        email,
        phone,
        address
      )
    `)
    .eq("doctor_id", doctorId)
    .not("patients", "is", null);

  return { data, error };
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select()
    .single();
  return { data, error };
};

export const getDoctorProfile = async (userId) => {
  const { data, error } = await supabase
    .from("doctors")
    .select("id, user_id, name, hospital, address, consultation_fee, verified, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  return { data, error };
};

// Nutritionist functions
export const createNutritionist = async (nutritionistData) => {
  const { data, error } = await supabase
    .from("nutritionists")
    .upsert([{ ...nutritionistData, verified: false }], { onConflict: 'user_id' })
    .select()
    .single();

  return { data, error };
};

export const getNutritionist = async (userId) => {
  const { data, error } = await supabase
    .from("nutritionists")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { data, error };
};

export const getVerifiedNutritionists = async () => {
  const { data, error } = await supabase
    .from("nutritionists")
    .select("*")
    .eq("verified", true)
    .order("name", { ascending: true });

  return { data, error };
};

export const updateNutritionist = async (userId, updates) => {
  const { data, error } = await supabase
    .from("nutritionists")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
};

// Physiotherapist functions
export const createPhysiotherapist = async (physiotherapistData) => {
  const { data, error } = await supabase
    .from("physiotherapists")
    .upsert([{ ...physiotherapistData, verified: false }], { onConflict: 'user_id' })
    .select()
    .single();

  return { data, error };
};

export const getPhysiotherapist = async (userId) => {
  const { data, error } = await supabase
    .from("physiotherapists")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { data, error };
};

export const getVerifiedPhysiotherapists = async () => {
  const { data, error } = await supabase
    .from("physiotherapists")
    .select("*")
    .eq("verified", true)
    .order("name", { ascending: true });

  return { data, error };
};

export const updatePhysiotherapist = async (userId, updates) => {
  const { data, error } = await supabase
    .from("physiotherapists")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
};

// Blog functions
export const getBlogs = async () => {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
};

export const createBlog = async (blogData) => {
  const { data, error } = await supabase
    .from("blogs")
    .insert([blogData])
    .select()
    .single();
  return { data, error };
};

export const deleteBlog = async (blogId) => {
  const { data, error } = await supabase
    .from("blogs")
    .delete()
    .eq("id", blogId);
  return { data, error };
};
