-- FINAL REPAIR SCRIPT: DIET LOGS
-- This script performs a "Hard Reset" on the diet_logs table to fix schema cache/column mismatch issues.

-- 1. Completely remove the old/broken table
DROP TABLE IF EXISTS public.diet_logs CASCADE;

-- 2. Re-create the table with EXACTLY the columns expected by your code
CREATE TABLE public.diet_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT,
    food_name TEXT NOT NULL,         -- This was the missing column
    calories DECIMAL,
    protein DECIMAL,
    carbs DECIMAL,
    fats DECIMAL,
    fiber DECIMAL,                   -- previously missing
    gi INTEGER,
    vitamins TEXT,
    minerals TEXT,
    image_url TEXT,
    ai_recognized BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Re-enable Security (RLS)
ALTER TABLE public.diet_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create the Policy (so you can actual save data)
CREATE POLICY "Users_Manage_Own_Diet_Logs" ON public.diet_logs
FOR ALL USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

-- 5. Force Schema Cache Reload (by notifying PostgREST)
NOTIFY pgrst, 'reload config';
