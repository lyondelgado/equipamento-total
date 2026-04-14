-- Create equipment type enum
CREATE TYPE public.equipment_type AS ENUM ('notebook', 'monitor', 'router', 'camera', 'printer');

-- Create equipment status enum
CREATE TYPE public.equipment_status AS ENUM ('active', 'maintenance', 'inactive');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type equipment_type NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  serial_number TEXT,
  asset_tag TEXT,
  status equipment_status NOT NULL DEFAULT 'active',
  location_branch TEXT NOT NULL DEFAULT '',
  location_department TEXT NOT NULL DEFAULT '',
  location_room TEXT NOT NULL DEFAULT '',
  assigned_to UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all equipment" ON public.equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert equipment" ON public.equipment FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update equipment" ON public.equipment FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete equipment" ON public.equipment FOR DELETE TO authenticated USING (true);

-- Create equipment movements table
CREATE TABLE public.equipment_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  from_person UUID REFERENCES public.profiles(id),
  to_person UUID REFERENCES public.profiles(id),
  from_location TEXT,
  to_location TEXT,
  notes TEXT,
  moved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all movements" ON public.equipment_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert movements" ON public.equipment_movements FOR INSERT TO authenticated WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes
CREATE INDEX idx_equipment_type ON public.equipment(type);
CREATE INDEX idx_equipment_status ON public.equipment(status);
CREATE INDEX idx_equipment_assigned_to ON public.equipment(assigned_to);
CREATE INDEX idx_movements_equipment_id ON public.equipment_movements(equipment_id);
CREATE INDEX idx_movements_created_at ON public.equipment_movements(created_at DESC);