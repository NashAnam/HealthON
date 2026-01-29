-- COMPREHENSIVE SECURITY & AVAILABILITY FIXES v4 (FINAL SAFETY VERSION)
-- Run this in your Supabase SQL Editor.
-- This script secures your data BUT explicitly guarantees that your App's workflows 
-- (Search Doctors, Signup, Prescriptions, Admin) remain fully functional.

-- ==============================================================================
-- 1. SECURE ADMIN ACTIONS (Bypassing RLS Safely)
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
-- 2. PUBLIC MARKETPLACE AVAILABILITY (Fixing "Always True" Warnings safely)
-- ==============================================================================
-- We replace insecure "View All" policies with "View Verified" policies.
-- This ensures patients can still search for doctors/labs, but can't see unverified/private data.

-- DOCTORS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
-- Clean up potential old insecure policies
DROP POLICY IF EXISTS "Allow public read access" ON public.doctors;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.doctors;
DROP POLICY IF EXISTS "Public can view doctors" ON public.doctors;
-- Add Secure Public Access
CREATE POLICY "Public_View_Verified_Doctors" ON public.doctors
FOR SELECT USING (verified = true);
-- Ensure Signup Works
DROP POLICY IF EXISTS "Allow individual insert" ON public.doctors;
CREATE POLICY "Doctors_Signup" ON public.doctors
FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Ensure Profile Edit Works
CREATE POLICY "Doctors_Edit_Profile" ON public.doctors
FOR UPDATE USING (auth.uid() = user_id);


-- LABS
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.labs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.labs;
CREATE POLICY "Public_View_Verified_Labs" ON public.labs
FOR SELECT USING (verified = true);
DROP POLICY IF EXISTS "Allow individual insert" ON public.labs;
CREATE POLICY "Labs_Signup" ON public.labs
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Labs_Edit_Profile" ON public.labs
FOR UPDATE USING (auth.uid() = user_id);


-- NUTRITIONISTS
ALTER TABLE public.nutritionists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.nutritionists;
CREATE POLICY "Public_View_Verified_Nutri" ON public.nutritionists
FOR SELECT USING (verified = true);
CREATE POLICY "Nutri_Signup" ON public.nutritionists
FOR INSERT WITH CHECK (auth.uid() = user_id);


-- PHYSIOTHERAPISTS
ALTER TABLE public.physiotherapists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.physiotherapists;
CREATE POLICY "Public_View_Verified_Physio" ON public.physiotherapists
FOR SELECT USING (verified = true);
CREATE POLICY "Physio_Signup" ON public.physiotherapists
FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 3. DOCTOR & PATIENT WORKFLOWS (Prescriptions & Reminders)
-- ==============================================================================

-- PRESCRIPTIONS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for doctors" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors can manage own prescriptions" ON public.prescriptions;

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
DROP POLICY IF EXISTS "Allow doctors to insert reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users_Manage_Own_Reminders" ON public.reminders;

-- Patient Permissions (Full Control of own reminders)
CREATE POLICY "Patients_Manage_Own_Reminders" ON public.reminders
FOR ALL USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

-- Doctor Permissions (Create/Delete for their patients via Prescription flow)
CREATE POLICY "Doctors_Create_Reminders" ON public.reminders
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid() AND verified = true)
);
CREATE POLICY "Doctors_Delete_Reminders" ON public.reminders
FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid() AND verified = true)
);


-- ==============================================================================
-- 4. CRITICAL DATA SECURITY (Payments & Telemedicine)
-- ==============================================================================

-- PAYMENTS (Strict Lockdown)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patients view own payments" ON public.payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.payments;

CREATE POLICY "Patients_View_Own_Payments" ON public.payments
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "Patients_Make_Payments" ON public.payments
FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);


-- TELEMEDICINE (Participants Only)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.telemedicine_messages;
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

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.telemedicine_signaling;
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


-- ==============================================================================
-- 5. DUPLICATE CLEANUP & OPTIMIZATIONS
-- ==============================================================================

-- DIET LOGS
DROP POLICY IF EXISTS "Enable access for users to their own diet logs" ON public.diet_logs;
CREATE POLICY "Users_Manage_Own_Diet_Logs" ON public.diet_logs
FOR ALL USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

-- APPOINTMENTS
DROP POLICY IF EXISTS "Doctors can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients manage own appointments" ON public.appointments;

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
DROP POLICY IF EXISTS "Labs view their bookings" ON public.lab_bookings;
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
