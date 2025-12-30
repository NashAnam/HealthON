// ---------------------- HEALTH TRACKER ----------------------

// Diet Logs
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

// Sleep Logs
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

// Goals
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

// Progress Reports
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

// ---------------------- DOCTOR DASHBOARD ----------------------

export const getDoctorAppointments = async (doctorId, date) => {
    let query = supabase
        .from("appointments")
        .select(`
      *,
      patients (
        name,
        email,
        phone,
        address
      )
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
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
    return { data, error };
};
