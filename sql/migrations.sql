-- MediConnect SQL Migrations (run in Supabase SQL editor)
-- Enable extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- Profiles table linking to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role text DEFAULT 'patient',
  nhis_number text,
  nhis_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hospitals
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text,
  state text,
  phone text,
  latitude numeric,
  longitude numeric,
  total_beds integer DEFAULT 0,
  available_beds integer DEFAULT 0,
  specialties text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Doctors
CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  full_name text,
  specialty text,
  is_available boolean DEFAULT true,
  consultation_fee numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ambulances
CREATE TABLE IF NOT EXISTS public.ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text,
  phone text,
  operator_user_id uuid REFERENCES auth.users(id),
  latitude numeric,
  longitude numeric,
  is_available boolean DEFAULT true,
  vehicle_type text,
  equipment_level text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Emergency cases
CREATE TABLE IF NOT EXISTS public.emergency_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES public.hospitals(id),
  ambulance_id uuid REFERENCES public.ambulances(id),
  case_type text,
  severity text,
  latitude numeric,
  longitude numeric,
  status text DEFAULT 'active', -- active, assigned, en_route, completed
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  emergency_case_id uuid REFERENCES public.emergency_cases(id),
  amount numeric,
  currency text DEFAULT 'NGN',
  status text DEFAULT 'pending',
  payment_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Simple RLS examples (you should extend and harden)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_owner_select ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY profiles_owner_update ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.emergency_cases ENABLE ROW LEVEL SECURITY;
-- Patients can create their own emergency cases
CREATE POLICY emergency_insert_owner ON public.emergency_cases FOR INSERT WITH CHECK (auth.uid() = patient_user_id);
-- Patients can see their own cases
CREATE POLICY emergency_select_owner ON public.emergency_cases FOR SELECT USING (auth.uid() = patient_user_id);
-- Ambulance operators and hospital admins will need additional policies in production

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hospitals_lat_lon ON public.hospitals ((latitude), (longitude));
CREATE INDEX IF NOT EXISTS idx_ambulances_lat_lon ON public.ambulances ((latitude), (longitude));
CREATE INDEX IF NOT EXISTS idx_emergency_lat_lon ON public.emergency_cases ((latitude), (longitude));
