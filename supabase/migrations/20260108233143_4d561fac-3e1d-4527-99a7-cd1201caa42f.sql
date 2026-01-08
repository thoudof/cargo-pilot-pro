-- Создание enum типов
CREATE TYPE public.app_role AS ENUM ('admin', 'dispatcher', 'driver');
CREATE TYPE public.app_permission AS ENUM (
  'view_trips', 'edit_trips', 'delete_trips',
  'view_contractors', 'edit_contractors', 'delete_contractors',
  'view_drivers', 'edit_drivers', 'delete_drivers',
  'view_vehicles', 'edit_vehicles', 'delete_vehicles',
  'view_routes', 'edit_routes', 'delete_routes',
  'view_cargo_types', 'edit_cargo_types', 'delete_cargo_types',
  'view_reports', 'view_admin_panel', 'view_finances', 'view_statistics',
  'manage_users', 'view_documents', 'edit_documents', 'delete_documents',
  'view_expenses', 'edit_expenses', 'delete_expenses',
  'manage_document_templates', 'manage_system', 'view_analytics', 'export_data'
);
CREATE TYPE public.document_type AS ENUM (
  'waybill', 'invoice', 'act', 'contract', 'power_of_attorney', 'other'
);

-- Таблица профилей пользователей
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица ролей пользователей
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Таблица индивидуальных прав пользователей
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission public.app_permission NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

-- Таблица прав для ролей
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission public.app_permission NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

-- Таблица контрагентов
CREATE TABLE public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  inn TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица контактов контрагентов
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица водителей
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  license TEXT,
  passport_data TEXT,
  experience_years INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица транспортных средств
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  capacity NUMERIC,
  year INTEGER,
  vin TEXT,
  registration_certificate TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  technical_inspection_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица маршрутов
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  point_a TEXT NOT NULL,
  point_b TEXT NOT NULL,
  distance_km NUMERIC,
  estimated_duration_hours NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица типов грузов
CREATE TABLE public.cargo_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  default_weight NUMERIC,
  default_volume NUMERIC,
  hazardous BOOLEAN DEFAULT false,
  temperature_controlled BOOLEAN DEFAULT false,
  fragile BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица рейсов
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'planned',
  departure_date TIMESTAMPTZ NOT NULL,
  arrival_date TIMESTAMPTZ,
  point_a TEXT NOT NULL,
  point_b TEXT NOT NULL,
  contractor_id UUID REFERENCES public.contractors(id),
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  route_id UUID REFERENCES public.routes(id),
  cargo_type_id UUID REFERENCES public.cargo_types(id),
  driver_name TEXT,
  driver_phone TEXT,
  driver_license TEXT,
  vehicle_brand TEXT,
  vehicle_model TEXT,
  vehicle_license_plate TEXT,
  vehicle_capacity NUMERIC,
  cargo_description TEXT,
  cargo_weight NUMERIC,
  cargo_volume NUMERIC,
  cargo_value NUMERIC,
  comments TEXT,
  documents TEXT[],
  change_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица расходов по рейсам
CREATE TABLE public.trip_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица документов рейсов
CREATE TABLE public.trip_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  document_type public.document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица шаблонов документов
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document_type public.document_type NOT NULL,
  content TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица уведомлений
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица push-токенов
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

-- Таблица логов активности
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Функция проверки роли
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Функция проверки права
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission public.app_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Проверка индивидуальных прав
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _permission
  ) OR EXISTS (
    -- Проверка прав через роль
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  )
$$;

-- Функция получения ролей пользователя
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применение триггеров
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contractors_updated_at BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cargo_types_updated_at BEFORE UPDATE ON public.cargo_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_expenses_updated_at BEFORE UPDATE ON public.trip_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Триггер создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- По умолчанию новый пользователь получает роль dispatcher
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'dispatcher');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Включение RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS политики для profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS политики для user_roles (только админы)
CREATE POLICY "Admins can manage user_roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- RLS политики для user_permissions (только админы)
CREATE POLICY "Admins can manage user_permissions" ON public.user_permissions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own permissions" ON public.user_permissions FOR SELECT USING (auth.uid() = user_id);

-- RLS политики для role_permissions (чтение всем аутентифицированным)
CREATE POLICY "Authenticated can read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS политики для справочников (чтение с правами, редактирование с правами)
CREATE POLICY "View contractors" ON public.contractors FOR SELECT USING (public.has_permission(auth.uid(), 'view_contractors'));
CREATE POLICY "Edit contractors" ON public.contractors FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'edit_contractors'));
CREATE POLICY "Update contractors" ON public.contractors FOR UPDATE USING (public.has_permission(auth.uid(), 'edit_contractors'));
CREATE POLICY "Delete contractors" ON public.contractors FOR DELETE USING (public.has_permission(auth.uid(), 'delete_contractors'));

CREATE POLICY "View contacts" ON public.contacts FOR SELECT USING (public.has_permission(auth.uid(), 'view_contractors'));
CREATE POLICY "Edit contacts" ON public.contacts FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'edit_contractors'));
CREATE POLICY "Update contacts" ON public.contacts FOR UPDATE USING (public.has_permission(auth.uid(), 'edit_contractors'));
CREATE POLICY "Delete contacts" ON public.contacts FOR DELETE USING (public.has_permission(auth.uid(), 'delete_contractors'));

CREATE POLICY "View drivers" ON public.drivers FOR SELECT USING (public.has_permission(auth.uid(), 'view_drivers'));
CREATE POLICY "Edit drivers" ON public.drivers FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'edit_drivers'));
CREATE POLICY "Update drivers" ON public.drivers FOR UPDATE USING (public.has_permission(auth.uid(), 'edit_drivers'));
CREATE POLICY "Delete drivers" ON public.drivers FOR DELETE USING (public.has_permission(auth.uid(), 'delete_drivers'));

CREATE POLICY "View vehicles" ON public.vehicles FOR SELECT USING (public.has_permission(auth.uid(), 'view_vehicles'));
CREATE POLICY "Edit vehicles" ON public.vehicles FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'edit_vehicles'));
CREATE POLICY "Update vehicles" ON public.vehicles FOR UPDATE USING (public.has_permission(auth.uid(), 'edit_vehicles'));
CREATE POLICY "Delete vehicles" ON public.vehicles FOR DELETE USING (public.has_permission(auth.uid(), 'delete_vehicles'));

CREATE POLICY "View routes" ON public.routes FOR SELECT USING (public.has_permission(auth.uid(), 'view_routes'));
CREATE POLICY "Edit routes" ON public.routes FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'edit_routes'));
CREATE POLICY "Update routes" ON public.routes FOR UPDATE USING (public.has_permission(auth.uid(), 'edit_routes'));
CREATE POLICY "Delete routes" ON public.routes FOR DELETE USING (public.has_permission(auth.uid(), 'delete_routes'));

CREATE POLICY "View cargo_types" ON public.cargo_types FOR SELECT USING (public.has_permission(auth.uid(), 'view_cargo_types'));
CREATE POLICY "Edit cargo_types" ON public.cargo_types FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'edit_cargo_types'));
CREATE POLICY "Update cargo_types" ON public.cargo_types FOR UPDATE USING (public.has_permission(auth.uid(), 'edit_cargo_types'));
CREATE POLICY "Delete cargo_types" ON public.cargo_types FOR DELETE USING (public.has_permission(auth.uid(), 'delete_cargo_types'));

-- RLS политики для trips
CREATE POLICY "View trips" ON public.trips FOR SELECT USING (public.has_permission(auth.uid(), 'view_trips'));
CREATE POLICY "Edit trips" ON public.trips FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'edit_trips'));
CREATE POLICY "Update trips" ON public.trips FOR UPDATE USING (public.has_permission(auth.uid(), 'edit_trips'));
CREATE POLICY "Delete trips" ON public.trips FOR DELETE USING (public.has_permission(auth.uid(), 'delete_trips'));

-- RLS политики для trip_expenses
CREATE POLICY "View trip_expenses" ON public.trip_expenses FOR SELECT USING (public.has_permission(auth.uid(), 'view_expenses'));
CREATE POLICY "Edit trip_expenses" ON public.trip_expenses FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'edit_expenses'));
CREATE POLICY "Update trip_expenses" ON public.trip_expenses FOR UPDATE USING (public.has_permission(auth.uid(), 'edit_expenses'));
CREATE POLICY "Delete trip_expenses" ON public.trip_expenses FOR DELETE USING (public.has_permission(auth.uid(), 'delete_expenses'));

-- RLS политики для trip_documents
CREATE POLICY "View trip_documents" ON public.trip_documents FOR SELECT USING (public.has_permission(auth.uid(), 'view_documents'));
CREATE POLICY "Edit trip_documents" ON public.trip_documents FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'edit_documents'));
CREATE POLICY "Delete trip_documents" ON public.trip_documents FOR DELETE USING (public.has_permission(auth.uid(), 'delete_documents'));

-- RLS политики для document_templates
CREATE POLICY "View document_templates" ON public.document_templates FOR SELECT USING (public.has_permission(auth.uid(), 'view_documents'));
CREATE POLICY "Manage document_templates" ON public.document_templates FOR ALL USING (public.has_permission(auth.uid(), 'manage_document_templates'));

-- RLS политики для notifications (пользователи видят только свои)
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- RLS политики для push_tokens
CREATE POLICY "Users manage own push_tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id);

-- RLS политики для activity_logs
CREATE POLICY "Admins view activity_logs" ON public.activity_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can create activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- Заполнение прав для ролей
-- Admin получает все права
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'view_trips'), ('admin', 'edit_trips'), ('admin', 'delete_trips'),
  ('admin', 'view_contractors'), ('admin', 'edit_contractors'), ('admin', 'delete_contractors'),
  ('admin', 'view_drivers'), ('admin', 'edit_drivers'), ('admin', 'delete_drivers'),
  ('admin', 'view_vehicles'), ('admin', 'edit_vehicles'), ('admin', 'delete_vehicles'),
  ('admin', 'view_routes'), ('admin', 'edit_routes'), ('admin', 'delete_routes'),
  ('admin', 'view_cargo_types'), ('admin', 'edit_cargo_types'), ('admin', 'delete_cargo_types'),
  ('admin', 'view_reports'), ('admin', 'view_admin_panel'), ('admin', 'view_finances'), ('admin', 'view_statistics'),
  ('admin', 'manage_users'), ('admin', 'view_documents'), ('admin', 'edit_documents'), ('admin', 'delete_documents'),
  ('admin', 'view_expenses'), ('admin', 'edit_expenses'), ('admin', 'delete_expenses'),
  ('admin', 'manage_document_templates'), ('admin', 'manage_system'), ('admin', 'view_analytics'), ('admin', 'export_data');

-- Dispatcher получает права на работу с рейсами и справочниками
INSERT INTO public.role_permissions (role, permission) VALUES
  ('dispatcher', 'view_trips'), ('dispatcher', 'edit_trips'),
  ('dispatcher', 'view_contractors'), ('dispatcher', 'edit_contractors'),
  ('dispatcher', 'view_drivers'), ('dispatcher', 'edit_drivers'),
  ('dispatcher', 'view_vehicles'), ('dispatcher', 'edit_vehicles'),
  ('dispatcher', 'view_routes'), ('dispatcher', 'edit_routes'),
  ('dispatcher', 'view_cargo_types'), ('dispatcher', 'edit_cargo_types'),
  ('dispatcher', 'view_reports'), ('dispatcher', 'view_finances'), ('dispatcher', 'view_statistics'),
  ('dispatcher', 'view_documents'), ('dispatcher', 'edit_documents'),
  ('dispatcher', 'view_expenses'), ('dispatcher', 'edit_expenses'),
  ('dispatcher', 'export_data');

-- Driver получает минимальные права
INSERT INTO public.role_permissions (role, permission) VALUES
  ('driver', 'view_trips'),
  ('driver', 'view_routes'),
  ('driver', 'view_documents'),
  ('driver', 'view_expenses');