
-- Создаем таблицу для водителей
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license TEXT,
  passport_data TEXT,
  experience_years INTEGER,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для транспортных средств
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  license_plate TEXT NOT NULL UNIQUE,
  capacity NUMERIC,
  year INTEGER,
  vin TEXT,
  registration_certificate TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  technical_inspection_expiry DATE,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для типов грузов
CREATE TABLE public.cargo_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_weight NUMERIC,
  default_volume NUMERIC,
  hazardous BOOLEAN DEFAULT false,
  temperature_controlled BOOLEAN DEFAULT false,
  fragile BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для маршрутов
CREATE TABLE public.routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  point_a TEXT NOT NULL,
  point_b TEXT NOT NULL,
  distance_km NUMERIC,
  estimated_duration_hours NUMERIC,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Обновляем таблицу trips для использования новых связей
ALTER TABLE public.trips 
ADD COLUMN driver_id UUID REFERENCES public.drivers(id),
ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id),
ADD COLUMN route_id UUID REFERENCES public.routes(id),
ADD COLUMN cargo_type_id UUID REFERENCES public.cargo_types(id);

-- Включаем Row Level Security для новых таблиц
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для drivers
CREATE POLICY "Users can view their own drivers" ON public.drivers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drivers" ON public.drivers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drivers" ON public.drivers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drivers" ON public.drivers
  FOR DELETE USING (auth.uid() = user_id);

-- Политики безопасности для vehicles
CREATE POLICY "Users can view their own vehicles" ON public.vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles" ON public.vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles" ON public.vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Политики безопасности для cargo_types
CREATE POLICY "Users can view their own cargo types" ON public.cargo_types
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cargo types" ON public.cargo_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cargo types" ON public.cargo_types
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cargo types" ON public.cargo_types
  FOR DELETE USING (auth.uid() = user_id);

-- Политики безопасности для routes
CREATE POLICY "Users can view their own routes" ON public.routes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routes" ON public.routes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routes" ON public.routes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routes" ON public.routes
  FOR DELETE USING (auth.uid() = user_id);

-- Индексы для производительности
CREATE INDEX idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX idx_vehicles_license_plate ON public.vehicles(license_plate);
CREATE INDEX idx_cargo_types_user_id ON public.cargo_types(user_id);
CREATE INDEX idx_routes_user_id ON public.routes(user_id);
CREATE INDEX idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX idx_trips_route_id ON public.trips(route_id);
CREATE INDEX idx_trips_cargo_type_id ON public.trips(cargo_type_id);
