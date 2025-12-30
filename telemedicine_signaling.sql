-- Create Telemedicine Signaling Table
CREATE TABLE IF NOT EXISTS public.telemedicine_signaling (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  "type" TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime for this table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'telemedicine_signaling'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.telemedicine_signaling;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.telemedicine_signaling ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to allow re-running the script
DROP POLICY IF EXISTS "Participants can manage signaling" ON public.telemedicine_signaling;

-- Allow participants of the appointment to manage signaling
CREATE POLICY "Participants can manage signaling" ON public.telemedicine_signaling
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = telemedicine_signaling.appointment_id
      AND (
        a.doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        OR 
        a.patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      )
    )
  );
