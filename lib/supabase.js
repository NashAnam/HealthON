import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const signInWithGoogle = async (redirectPath = null) => {
  // Default redirect based on context
  const defaultRedirect = redirectPath || (typeof window !== 'undefined' ? window.location.origin : '');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: defaultRedirect,
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

/**
 * Identifies the role of a user by checking all expert tables and the patient table.
 * @param {string} userId - The Supabase Auth user ID
 * @returns {Object} { role: 'patient'|'doctor'|'lab'|'nutritionist'|'physiotherapist'|'unregistered', data: profileData }
 */
export const identifyUserRole = async (userId) => {
  if (!userId) return { role: 'unregistered', data: null };

  const [patientRes, doctorRes, labRes, nutriRes, physioRes] = await Promise.all([
    getPatient(userId),
    getDoctor(userId),
    getLab(userId),
    getNutritionist(userId),
    getPhysiotherapist(userId)
  ]);

  if (doctorRes.data) return { role: 'doctor', data: doctorRes.data };
  if (labRes.data) return { role: 'lab', data: labRes.data };
  if (nutriRes.data) return { role: 'nutritionist', data: nutriRes.data };
  if (physioRes.data) return { role: 'physiotherapist', data: physioRes.data };
  if (patientRes.data) return { role: 'patient', data: patientRes.data };

  return { role: 'unregistered', data: null };
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

/**
 * Ensures a patient profile exists for the current user
 * Creates one automatically if it doesn't exist
 * @param {Object} user - Current authenticated user
 * @returns {Object} { data: patient profile, error }
 */
export const ensurePatientProfile = async (user) => {
  if (!user) {
    return { data: null, error: new Error('No authenticated user') };
  }

  // Check if patient profile exists
  const { data: existingPatient, error: fetchError } = await getPatient(user.id);

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // If profile exists, return it
  if (existingPatient) {
    return { data: existingPatient, error: null };
  }

  // Create new patient profile with basic info from auth
  const patientData = {
    user_id: user.id,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    email: user.email,
    phone: user.user_metadata?.phone || '',
    age: user.user_metadata?.age || null,
    accepted_terms: false
  };

  return await createPatient(patientData);
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
    .select("id, user_id, name, hospital, address, consultation_fee, verified, created_at, available_days, timings")
    .eq("user_id", userId)
    .maybeSingle();
  return { data, error };
};

export const getDoctorById = async (doctorId) => {
  const { data, error } = await supabase
    .from("doctors")
    .select("id, user_id, name, hospital, address, consultation_fee, verified, created_at, available_days, timings")
    .eq("id", doctorId)
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

// --- Expert Hub Functions (Nutritionists & Physiotherapists) ---

export const getNutritionistPatients = async (nutritionistId) => {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      patient_id,
      patients (
        id,
        name,
        email,
        phone,
        age,
        blood_group,
        height,
        weight
      )
    `)
    .eq("nutritionist_id", nutritionistId)
    .not("patients", "is", null);

  return { data, error };
};

export const getNutritionistAppointments = async (nutritionistId, date = null) => {
  let query = supabase
    .from("appointments")
    .select(`
      *,
      patients (
        id,
        name,
        phone
      )
    `)
    .eq("nutritionist_id", nutritionistId)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (date) {
    query = query.eq("appointment_date", date);
  }

  const { data, error } = await query;
  return { data, error };
};

export const getDietPlans = async (nutritionistId, patientId = null) => {
  let query = supabase
    .from("diet_plans")
    .select(`
      *,
      patients (
        name
      )
    `)
    .eq("nutritionist_id", nutritionistId)
    .order("created_at", { ascending: false });

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data, error } = await query;
  return { data, error };
};

export const assignDietPlan = async (planData) => {
  const { data, error } = await supabase
    .from("diet_plans")
    .insert([planData])
    .select()
    .single();

  return { data, error };
};

export const getPatientDietPlans = async (patientId) => {
  return await getDietPlans(null, patientId);
};

export const getPhysiotherapistAppointments = async (physioId, date = null) => {
  let query = supabase
    .from("appointments")
    .select(`
      *,
      patients (
        id,
        name,
        phone
      )
    `)
    .eq("physiotherapist_id", physioId)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (date) {
    query = query.eq("appointment_date", date);
  }

  const { data, error } = await query;
  return { data, error };
};

export const getExercisePlans = async (physioId, patientId = null) => {
  let query = supabase
    .from("exercise_plans")
    .select(`
      *,
      patients (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (physioId) {
    query = query.eq("physiotherapist_id", physioId);
  }

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data, error } = await query;
  return { data, error };
};

export const assignExercisePlan = async (planData) => {
  const { data, error } = await supabase
    .from("exercise_plans")
    .insert([planData])
    .select()
    .single();

  return { data, error };
};

export const getPatientExercisePlans = async (patientId) => {
  return await getExercisePlans(null, patientId);
};

// Physiotherapist specialized functions
export const getPhysiotherapistPatients = async (physioId) => {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      patient_id,
      patients (*)
    `)
    .eq("physiotherapist_id", physioId)
    .not("patients", "is", null);

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

export const updateBlog = async (blogId, blogData) => {
  const { data, error } = await supabase
    .from("blogs")
    .update(blogData)
    .eq("id", blogId)
    .select()
    .single();
  return { data, error };
};

export const syncPatientReminders = async (patientId) => {
  try {
    // 1. Fetch Active Plans & Prescriptions
    const [dietRes, exerciseRes, prescriptionRes, remindersRes] = await Promise.all([
      getPatientDietPlans(patientId),
      getPatientExercisePlans(patientId),
      supabase.from('prescriptions').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      getReminders(patientId)
    ]);

    const activeDietPlans = dietRes.data || [];
    const activeExercisePlans = exerciseRes.data || [];
    const latestPrescription = prescriptionRes.data;
    const existingReminders = remindersRes.data || [];

    const newReminders = [];
    const now = new Date().toISOString();

    // 2. Sync Diet Plan Reminder
    if (activeDietPlans.length > 0) {
      const hasDietReminder = existingReminders.some(r =>
        r.title && r.title.toLowerCase().includes('diet') && r.is_active
      );

      if (!hasDietReminder) {
        newReminders.push({
          patient_id: patientId,
          title: 'Daily Diet Plan',
          description: 'Follow your assigned diet chart for today.',
          reminder_time: '08:00',
          reminder_type: 'diet',
          frequency: 'Daily',
          is_active: true,
          created_at: now
        });
      }
    }

    // 3. Sync Exercise Plan Reminder
    if (activeExercisePlans.length > 0) {
      const hasExerciseReminder = existingReminders.some(r =>
        r.title && r.title.toLowerCase().includes('exercise') && r.is_active
      );

      if (!hasExerciseReminder) {
        newReminders.push({
          patient_id: patientId,
          title: 'Daily Exercise Routine',
          description: 'Complete your assigned exercises.',
          reminder_time: '07:00',
          reminder_type: 'exercise',
          frequency: 'Daily',
          is_active: true,
          created_at: now
        });
      }
    }

    // 4. Sync Medication Reminders from Latest Prescription
    if (latestPrescription && latestPrescription.medications && Array.isArray(latestPrescription.medications)) {
      latestPrescription.medications.forEach(med => {
        const medTitle = `Take ${med.name}`;
        const hasMedReminder = existingReminders.some(r =>
          r.title === medTitle && r.is_active
        );

        if (!hasMedReminder) {
          let time = '09:00';
          const instr = (med.instructions || '').toLowerCase();
          const freq = (med.frequency || '').toLowerCase();

          if (instr.includes('morning') || freq.includes('morning')) time = '08:00';
          else if (instr.includes('afternoon') || freq.includes('afternoon')) time = '14:00';
          else if (instr.includes('night') || freq.includes('night')) time = '21:00';
          else if (instr.includes('evening') || freq.includes('evening')) time = '19:00';

          newReminders.push({
            patient_id: patientId,
            title: medTitle,
            description: `${med.dosage || ''} - ${med.instructions || 'As prescribed'}`,
            reminder_time: time,
            reminder_type: 'medication',
            frequency: med.frequency || 'Daily',
            is_active: true,
            created_at: now
          });
        }
      });
    }

    // 5. Insert New Reminders
    if (newReminders.length > 0) {
      const { error } = await supabase.from('reminders').insert(newReminders);
      if (error) {
        console.error('Error inserting reminders:', error);
      }
      return { success: true, count: newReminders.length };
    }

    return { success: true, count: 0 };
  } catch (error) {
    console.error('Error syncing reminders:', error);
    return { success: false, error };
  }
};
