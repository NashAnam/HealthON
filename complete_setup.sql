-- MASTER SETUP SCRIPT
-- Run this in Supabase SQL Editor.
-- It creates missing tables (like diet_logs) AND applies all security fixes.

-- ==============================================================================
-- 1. CREATE MISSING TABLES
-- ==============================================================================

-- Diet Logs (Was missing in some environments)
CREATE TABLE IF NOT EXISTS public.diet_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT,
    food_name TEXT NOT NULL,
    calories DECIMAL,
    protein DECIMAL,
    carbs DECIMAL,
    fats DECIMAL,
    fiber DECIMAL,
    gi INTEGER,
    vitamins TEXT,
    minerals TEXT,
    image_url TEXT,
    ai_recognized BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 2. SECURE ADMIN ACTIONS (RPC Functions)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_verify_user(
    target_table TEXT,
    target_id UUID,
    passphrase TEXT
) RETURNS VOID AS $$
BEGIN
    IF passphrase <> 'Admin@HealthOn2026' THEN
        RAISE EXCEPTION 'Access Denied: Invalid Passphrase';
    END IF;

    IF target_table NOT IN ('doctors', 'labs', 'nutritionists', 'physiotherapists') THEN
        RAISE EXCEPTION 'Invalid target table';
    END IF;

    EXECUTE format('UPDATE public.%I SET verified = true WHERE id = $1', target_table) USING target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.admin_reject_user(
    target_table TEXT,
    target_id UUID,
    passphrase TEXT
) RETURNS VOID AS $$
BEGIN
    IF passphrase <> 'Admin@HealthOn2026' THEN
        RAISE EXCEPTION 'Access Denied: Invalid Passphrase';
    END IF;

    IF target_table NOT IN ('doctors', 'labs', 'nutritionists', 'physiotherapists') THEN
        RAISE EXCEPTION 'Invalid target table';
    END IF;

    EXECUTE format('DELETE FROM public.%I WHERE id = $1', target_table) USING target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 3. APPLY ROW LEVEL SECURITY (Safety v4 Policies)
-- ==============================================================================

-- DIET LOGS
ALTER TABLE public.diet_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for users to their own diet logs" ON public.diet_logs;
DROP POLICY IF EXISTS "Users manage own diet logs" ON public.diet_logs;

CREATE POLICY "Users_Manage_Own_Diet_Logs" ON public.diet_logs
FOR ALL USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);


-- PAYMENTS (Strict Lockdown)
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patients view own payments" ON public.payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.payments;
DROP POLICY IF EXISTS "Patients_View_Own_Payments" ON public.payments; -- Clean up
DROP POLICY IF EXISTS "Patients_Make_Payments" ON public.payments;       -- Clean up

CREATE POLICY "Patients_View_Own_Payments" ON public.payments
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "Patients_Make_Payments" ON public.payments
FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);


-- DOCTORS (Marketplace Access)
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.doctors;
DROP POLICY IF EXISTS "Public_View_Verified_Doctors" ON public.doctors; -- Clean up

CREATE POLICY "Public_View_Verified_Doctors" ON public.doctors
FOR SELECT USING (verified = true);

DROP POLICY IF EXISTS "Doctors_Signup" ON public.doctors;
CREATE POLICY "Doctors_Signup" ON public.doctors
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors_Edit_Profile" ON public.doctors;
CREATE POLICY "Doctors_Edit_Profile" ON public.doctors
FOR UPDATE USING (auth.uid() = user_id);


-- LABS (Marketplace Access)
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.labs;
DROP POLICY IF EXISTS "Public_View_Verified_Labs" ON public.labs;

CREATE POLICY "Public_View_Verified_Labs" ON public.labs
FOR SELECT USING (verified = true);

DROP POLICY IF EXISTS "Labs_Signup" ON public.labs;
CREATE POLICY "Labs_Signup" ON public.labs
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Labs_Edit_Profile" ON public.labs;
CREATE POLICY "Labs_Edit_Profile" ON public.labs
FOR UPDATE USING (auth.uid() = user_id);


-- NUTRITIONISTS
ALTER TABLE public.nutritionists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.nutritionists;
DROP POLICY IF EXISTS "Public_View_Verified_Nutri" ON public.nutritionists;

CREATE POLICY "Public_View_Verified_Nutri" ON public.nutritionists
FOR SELECT USING (verified = true);

DROP POLICY IF EXISTS "Nutri_Signup" ON public.nutritionists;
CREATE POLICY "Nutri_Signup" ON public.nutritionists
FOR INSERT WITH CHECK (auth.uid() = user_id);


-- PHYSIOTHERAPISTS
ALTER TABLE public.physiotherapists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.physiotherapists;
DROP POLICY IF EXISTS "Public_View_Verified_Physio" ON public.physiotherapists;

CREATE POLICY "Public_View_Verified_Physio" ON public.physiotherapists
FOR SELECT USING (verified = true);

DROP POLICY IF EXISTS "Physio_Signup" ON public.physiotherapists;
CREATE POLICY "Physio_Signup" ON public.physiotherapists
FOR INSERT WITH CHECK (auth.uid() = user_id);


-- PRESCRIPTIONS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctors_View_Own_Rx" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors_Create_Rx" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors_Delete_Own_Rx" ON public.prescriptions;
DROP POLICY IF EXISTS "Patients_View_Own_Rx" ON public.prescriptions;

-- Doctor Permissions
CREATE POLICY "Doctors_View_Own_Rx" ON public.prescriptions
FOR SELECT USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors_Create_Rx" ON public.prescriptions
FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors_Delete_Own_Rx" ON public.prescriptions
FOR DELETE USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);
-- Patient Permissions
CREATE POLICY "Patients_View_Own_Rx" ON public.prescriptions
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);


-- REMINDERS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patients_Manage_Own_Reminders" ON public.reminders;
DROP POLICY IF EXISTS "Doctors_Create_Reminders" ON public.reminders;
DROP POLICY IF EXISTS "Doctors_Delete_Reminders" ON public.reminders;

-- Patient Permissions
CREATE POLICY "Patients_Manage_Own_Reminders" ON public.reminders
FOR ALL USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
-- Doctor Permissions
CREATE POLICY "Doctors_Create_Reminders" ON public.reminders
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid() AND verified = true)
);
CREATE POLICY "Doctors_Delete_Reminders" ON public.reminders
FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid() AND verified = true)
);


-- TELEMEDICINE
DROP POLICY IF EXISTS "Telemedicine_Secure_Access" ON public.telemedicine_messages;
CREATE POLICY "Telemedicine_Secure_Access" ON public.telemedicine_messages
FOR ALL USING (
    appointment_id IN (
        SELECT id FROM public.appointments
        WHERE
            patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
            OR
            doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Signaling_Secure_Access" ON public.telemedicine_signaling;
CREATE POLICY "Signaling_Secure_Access" ON public.telemedicine_signaling
FOR ALL USING (
    appointment_id IN (
        SELECT id FROM public.appointments
        WHERE
            patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
            OR
            doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
    )
);

-- APPOINTMENTS
DROP POLICY IF EXISTS "Patients_Manage_Own_Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors_View_Own_Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors_Update_Own_Appointments" ON public.appointments;

CREATE POLICY "Patients_Manage_Own_Appointments" ON public.appointments
FOR ALL USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors_View_Own_Appointments" ON public.appointments
FOR SELECT USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors_Update_Own_Appointments" ON public.appointments
FOR UPDATE USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);

-- LAB BOOKINGS
DROP POLICY IF EXISTS "Patients_Manage_Own_Lab_Bookings" ON public.lab_bookings;
DROP POLICY IF EXISTS "Labs_Manage_Own_Bookings" ON public.lab_bookings;

CREATE POLICY "Patients_Manage_Own_Lab_Bookings" ON public.lab_bookings
FOR ALL USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "Labs_Manage_Own_Bookings" ON public.lab_bookings
FOR ALL USING (
    lab_id IN (SELECT id FROM public.labs WHERE user_id = auth.uid())
);

-- Fix Search Path
ALTER FUNCTION public.award_points SET search_path = public;
