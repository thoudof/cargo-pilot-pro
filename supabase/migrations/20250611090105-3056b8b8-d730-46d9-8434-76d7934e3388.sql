
-- Создаем таблицу для контрагентов
CREATE TABLE public.contractors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  inn TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для контактов
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для рейсов
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_date TIMESTAMP WITH TIME ZONE,
  point_a TEXT NOT NULL,
  point_b TEXT NOT NULL,
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  driver_license TEXT,
  vehicle_brand TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_license_plate TEXT NOT NULL,
  vehicle_capacity NUMERIC,
  cargo_description TEXT NOT NULL,
  cargo_weight NUMERIC NOT NULL,
  cargo_volume NUMERIC NOT NULL,
  cargo_value NUMERIC,
  comments TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу профилей пользователей
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'dispatcher' CHECK (role IN ('owner', 'dispatcher', 'driver')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем Row Level Security для всех таблиц
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для contractors
CREATE POLICY "Users can view their own contractors" ON public.contractors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contractors" ON public.contractors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contractors" ON public.contractors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contractors" ON public.contractors
  FOR DELETE USING (auth.uid() = user_id);

-- Политики безопасности для contacts
CREATE POLICY "Users can view contacts of their contractors" ON public.contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contractors 
      WHERE contractors.id = contacts.contractor_id 
      AND contractors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contacts for their contractors" ON public.contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contractors 
      WHERE contractors.id = contacts.contractor_id 
      AND contractors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts of their contractors" ON public.contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.contractors 
      WHERE contractors.id = contacts.contractor_id 
      AND contractors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts of their contractors" ON public.contacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.contractors 
      WHERE contractors.id = contacts.contractor_id 
      AND contractors.user_id = auth.uid()
    )
  );

-- Политики безопасности для trips
CREATE POLICY "Users can view their own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- Политики безопасности для profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'dispatcher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для создания профиля
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Индексы для производительности
CREATE INDEX idx_contractors_user_id ON public.contractors(user_id);
CREATE INDEX idx_contacts_contractor_id ON public.contacts(contractor_id);
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_contractor_id ON public.trips(contractor_id);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_departure_date ON public.trips(departure_date);
