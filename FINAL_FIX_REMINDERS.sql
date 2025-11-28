-- COMPLETE REMINDERS TABLE FIX
-- Copy and run this ENTIRE script in Supabase SQL Editor

-- Step 1: Drop the existing reminders table completely
DROP TABLE IF EXISTS reminders CASCADE;

-- Step 2: Create fresh reminders table with correct structure
CREATE TABLE reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  reminder_type TEXT DEFAULT 'medication',
  title TEXT NOT NULL,
  description TEXT,
  reminder_time TEXT NOT NULL,
  frequency TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Patients manage own reminders" ON reminders 
  FOR ALL 
  USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- DONE! Reminders table is now ready
