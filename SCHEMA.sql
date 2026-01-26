-- HealthON Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. NUTRITIONISTS TABLE
CREATE TABLE IF NOT EXISTS public.nutritionists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    qualification TEXT,
    experience INTEGER DEFAULT 0,
    fee DECIMAL DEFAULT 0.0,
    timings TEXT,
    available_days TEXT[], -- PostgreSQL Array Type
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. PHYSIOTHERAPISTS TABLE
CREATE TABLE IF NOT EXISTS public.physiotherapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    qualification TEXT,
    experience INTEGER DEFAULT 0,
    fee DECIMAL DEFAULT 0.0,
    timings TEXT,
    available_days TEXT[], -- PostgreSQL Array Type
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. DOCTORS TABLE (Ensure column consistency)
-- If this table exists, ensure available_days is an array
-- ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS available_days TEXT[];

-- 3. LABS TABLE
CREATE TABLE IF NOT EXISTS public.labs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    license_number TEXT,
    tests_list TEXT,
    report_delivery_method TEXT,
    lab_type TEXT,
    accreditations TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- RLS POLICIES

-- Nutritionists
ALTER TABLE public.nutritionists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.nutritionists FOR SELECT USING (true);
CREATE POLICY "Allow individual insert" ON public.nutritionists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow individual update" ON public.nutritionists FOR UPDATE USING (auth.uid() = user_id);

-- Physiotherapists
ALTER TABLE public.physiotherapists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.physiotherapists FOR SELECT USING (true);
CREATE POLICY "Allow individual insert" ON public.physiotherapists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow individual update" ON public.physiotherapists FOR UPDATE USING (auth.uid() = user_id);

-- Labs
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.labs FOR SELECT USING (true);
CREATE POLICY "Allow individual insert" ON public.labs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow individual update" ON public.labs FOR UPDATE USING (auth.uid() = user_id);
