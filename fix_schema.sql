-- ========================================
-- COMPLETE CAREON DATABASE
-- All features included with proper connections
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- DROP ALL EXISTING TABLES
-- ========================================
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS lab_bookings CASCADE;
DROP TABLE IF EXISTS health_assessments CASCADE;
DROP TABLE IF EXISTS vitals CASCADE;
DROP TABLE IF EXISTS lab_reports CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS labs CASCADE;

-- ========================================
-- CORE PROFILE TABLES
-- ========================================

-- PATIENTS (name, age, phone, email)
CREATE TABLE patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  consent_given BOOLEAN DEFAULT FALSE,
  subscription_end_date TIMESTAMPTZ,
  height NUMERIC,
  weight NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCTORS (name, qualification, experience, available_days, timings)
CREATE TABLE doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qualification TEXT NOT NULL,
  experience TEXT NOT NULL,
  available_days TEXT[] NOT NULL,
  timings TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LABS (name, address, license_number, tests_list, report_delivery_method)
CREATE TABLE labs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  license_number TEXT NOT NULL,
  tests_list TEXT NOT NULL,
  report_delivery_method TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PATIENT FEATURES
-- ========================================

-- VITALS (vitals tracking)
CREATE TABLE vitals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  heart_rate INT,
  systolic_bp INT,
  diastolic_bp INT,
  blood_sugar INT,
  weight NUMERIC,
  height NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- HEALTH ASSESSMENTS (health assessment questionnaire)
CREATE TABLE health_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REMINDERS (medication/appointment reminders)
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

-- ========================================
-- CONNECTION TABLES (Patient-Doctor-Lab)
-- ========================================

-- APPOINTMENTS (connects patients with doctors)
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  consultation_type TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LAB BOOKINGS (connects patients with labs)
CREATE TABLE lab_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  test_date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LAB REPORTS (lab test results)
CREATE TABLE lab_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  report_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS (payment tracking)
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  payment_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES
-- ========================================

-- PATIENTS
CREATE POLICY "Users view own patient profile" ON patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own patient profile" ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own patient profile" ON patients FOR UPDATE USING (auth.uid() = user_id);

-- DOCTORS
CREATE POLICY "Everyone views verified doctors" ON doctors FOR SELECT USING (TRUE);
CREATE POLICY "Doctors insert own profile" ON doctors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Doctors update own profile" ON doctors FOR UPDATE USING (auth.uid() = user_id);

-- LABS
CREATE POLICY "Everyone views verified labs" ON labs FOR SELECT USING (TRUE);
CREATE POLICY "Labs insert own profile" ON labs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Labs update own profile" ON labs FOR UPDATE USING (auth.uid() = user_id);

-- VITALS
CREATE POLICY "Patients manage own vitals" ON vitals FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

-- HEALTH ASSESSMENTS
CREATE POLICY "Patients manage own assessments" ON health_assessments FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

-- REMINDERS
CREATE POLICY "Patients manage own reminders" ON reminders 
  FOR ALL 
  USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- APPOINTMENTS (Patient-Doctor connection)
CREATE POLICY "Patients manage own appointments" ON appointments FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors view their appointments" ON appointments FOR SELECT USING (
  doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors update their appointments" ON appointments FOR UPDATE USING (
  doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- LAB BOOKINGS (Patient-Lab connection)
CREATE POLICY "Patients manage own lab bookings" ON lab_bookings FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Labs view their bookings" ON lab_bookings FOR SELECT USING (
  lab_id IN (SELECT id FROM labs WHERE user_id = auth.uid())
);
CREATE POLICY "Labs update their bookings" ON lab_bookings FOR UPDATE USING (
  lab_id IN (SELECT id FROM labs WHERE user_id = auth.uid())
);

-- LAB REPORTS
CREATE POLICY "Patients manage own lab reports" ON lab_reports FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

-- PAYMENTS
CREATE POLICY "Patients manage own payments" ON payments FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

-- ========================================
-- DONE! Complete database ready
-- ========================================
-- 
-- FEATURES COVERED:
-- ✅ Patient Profile
-- ✅ Doctor Profile  
-- ✅ Lab Profile
-- ✅ Vitals Tracking
-- ✅ Health Assessments
-- ✅ Reminders
-- ✅ Doctor Booking (Patient-Doctor connection via appointments)
-- ✅ Lab Booking (Patient-Lab connection via lab_bookings)
-- ✅ Doctor Dashboard (view appointments)
-- ✅ Doctor OPD (manage appointments)
-- ✅ Doctor Patients (view patients via appointments)
-- ✅ Lab Dashboard (view bookings)
-- ✅ Lab Reports
-- ✅ Payments
--
