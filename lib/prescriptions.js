
// ---------------------- PRESCRIPTIONS ----------------------

export const createPrescription = async (prescriptionData) => {
    const { data, error } = await supabase
        .from('prescriptions')
        .insert([prescriptionData])
        .select()
        .single();
    return { data, error };
};

export const getPatientPrescriptions = async (patientId) => {
    const { data, error } = await supabase
        .from('prescriptions')
        .select('*, doctors(*), appointments(*)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
    return { data, error };
};

export const getDoctorPrescriptions = async (doctorId) => {
    const { data, error } = await supabase
        .from('prescriptions')
        .select('*, patients(*), appointments(*)')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });
    return { data, error };
};

export const getPrescriptionByAppointment = async (appointmentId) => {
    const { data, error } = await supabase
        .from('prescriptions')
        .select('*, doctors(*)')
        .eq('appointment_id', appointmentId)
        .maybeSingle();
    return { data, error };
};
