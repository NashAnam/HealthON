-- MASTER NUTRITIONIST & PHYSIOTHERAPIST SCHEMA UPDATE
-- Run this in Supabase SQL Editor.

-- ==============================================================================
-- 1. UPDATE APPOINTMENTS TABLE
-- ==============================================================================

-- Add expert columns to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS nutritionist_id UUID REFERENCES public.nutritionists(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS physiotherapist_id UUID REFERENCES public.physiotherapists(id);

-- Update RLS for Appointments to include Nutritionists and Physiotherapists
DROP POLICY IF EXISTS "Nutritionists_View_Own_Appointments" ON public.appointments;
CREATE POLICY "Nutritionists_View_Own_Appointments" ON public.appointments
FOR SELECT USING (
    nutritionist_id IN (SELECT id FROM public.nutritionists WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Nutritionists_Update_Own_Appointments" ON public.appointments;
CREATE POLICY "Nutritionists_Update_Own_Appointments" ON public.appointments
FOR UPDATE USING (
    nutritionist_id IN (SELECT id FROM public.nutritionists WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Physios_View_Own_Appointments" ON public.appointments;
CREATE POLICY "Physios_View_Own_Appointments" ON public.appointments
FOR SELECT USING (
    physiotherapist_id IN (SELECT id FROM public.physiotherapists WHERE user_id = auth.uid())
);


-- ==============================================================================
-- 2. CREATE DIET PLANS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    meals JSONB NOT NULL DEFAULT '{"breakfast": [], "lunch": [], "dinner": [], "snacks": []}',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

-- Nutritionists manage their own plans
CREATE POLICY "Nutritionists_Manage_Own_Plans" ON public.diet_plans
FOR ALL USING (
    nutritionist_id IN (SELECT id FROM public.nutritionists WHERE user_id = auth.uid())
);

-- Patients view plans assigned to them
CREATE POLICY "Patients_View_Assigned_Plans" ON public.diet_plans
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
