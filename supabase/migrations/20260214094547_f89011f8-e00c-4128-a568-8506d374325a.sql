
-- 2. Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  inn text,
  address text,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3. Create company_members table
CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- 4. Add company_id to data tables
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.cargo_types ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.trip_templates ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 5. Add current_company_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- 6. Create test company
INSERT INTO public.companies (id, name, inn, address) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Тестовая компания', '0000000000', 'Тестовый адрес');

-- Assign existing data
UPDATE public.contractors SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.drivers SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.vehicles SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.routes SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.cargo_types SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.trips SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.trip_templates SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;

-- Make NOT NULL
ALTER TABLE public.contractors ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.drivers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.vehicles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.routes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.cargo_types ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.trips ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.trip_templates ALTER COLUMN company_id SET NOT NULL;

-- 8. Add existing users to test company
INSERT INTO public.company_members (company_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', ur.user_id, 
  CASE WHEN ur.role = 'admin' THEN 'admin' 
       WHEN ur.role = 'dispatcher' THEN 'dispatcher'
       WHEN ur.role = 'driver' THEN 'driver'
       ELSE 'member' END
FROM public.user_roles ur
WHERE ur.role != 'global_admin'
ON CONFLICT (company_id, user_id) DO NOTHING;

UPDATE public.profiles SET current_company_id = '00000000-0000-0000-0000-000000000001' WHERE current_company_id IS NULL;

-- 9. Helper functions
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT current_company_id FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'global_admin')
$$;

CREATE OR REPLACE FUNCTION public.user_in_company(_user_id uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members WHERE user_id = _user_id AND company_id = _company_id AND is_active = true
  ) OR public.is_global_admin(_user_id)
$$;

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_contractors_company ON public.contractors(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_company ON public.drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_company ON public.vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_company ON public.routes(company_id);
CREATE INDEX IF NOT EXISTS idx_cargo_types_company ON public.cargo_types(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_company ON public.trips(company_id);
CREATE INDEX IF NOT EXISTS idx_trip_templates_company ON public.trip_templates(company_id);

-- 11. RLS: companies
CREATE POLICY "Global admins can manage companies" ON public.companies FOR ALL USING (public.is_global_admin(auth.uid()));
CREATE POLICY "Members can view own company" ON public.companies FOR SELECT USING (id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND is_active = true));

-- 12. RLS: company_members
CREATE POLICY "Global admins can manage all members" ON public.company_members FOR ALL USING (public.is_global_admin(auth.uid()));
CREATE POLICY "Company admins can manage own company members" ON public.company_members FOR ALL USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role = 'admin' AND cm.is_active = true));
CREATE POLICY "Users can view own membership" ON public.company_members FOR SELECT USING (auth.uid() = user_id);

-- 13. Update RLS for data tables with company scope
-- Contractors
DROP POLICY IF EXISTS "View contractors" ON public.contractors;
CREATE POLICY "View contractors" ON public.contractors FOR SELECT USING (has_permission(auth.uid(), 'view_contractors'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Edit contractors" ON public.contractors;
CREATE POLICY "Edit contractors" ON public.contractors FOR INSERT WITH CHECK (has_permission(auth.uid(), 'edit_contractors'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Update contractors" ON public.contractors;
CREATE POLICY "Update contractors" ON public.contractors FOR UPDATE USING (has_permission(auth.uid(), 'edit_contractors'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Delete contractors" ON public.contractors;
CREATE POLICY "Delete contractors" ON public.contractors FOR DELETE USING (has_permission(auth.uid(), 'delete_contractors'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));

-- Drivers
DROP POLICY IF EXISTS "View drivers" ON public.drivers;
CREATE POLICY "View drivers" ON public.drivers FOR SELECT USING (has_permission(auth.uid(), 'view_drivers'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Edit drivers" ON public.drivers;
CREATE POLICY "Edit drivers" ON public.drivers FOR INSERT WITH CHECK (has_permission(auth.uid(), 'edit_drivers'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Update drivers" ON public.drivers;
CREATE POLICY "Update drivers" ON public.drivers FOR UPDATE USING (has_permission(auth.uid(), 'edit_drivers'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Delete drivers" ON public.drivers;
CREATE POLICY "Delete drivers" ON public.drivers FOR DELETE USING (has_permission(auth.uid(), 'delete_drivers'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));

-- Vehicles
DROP POLICY IF EXISTS "View vehicles" ON public.vehicles;
CREATE POLICY "View vehicles" ON public.vehicles FOR SELECT USING (has_permission(auth.uid(), 'view_vehicles'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Edit vehicles" ON public.vehicles;
CREATE POLICY "Edit vehicles" ON public.vehicles FOR INSERT WITH CHECK (has_permission(auth.uid(), 'edit_vehicles'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Update vehicles" ON public.vehicles;
CREATE POLICY "Update vehicles" ON public.vehicles FOR UPDATE USING (has_permission(auth.uid(), 'edit_vehicles'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Delete vehicles" ON public.vehicles;
CREATE POLICY "Delete vehicles" ON public.vehicles FOR DELETE USING (has_permission(auth.uid(), 'delete_vehicles'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));

-- Routes
DROP POLICY IF EXISTS "View routes" ON public.routes;
CREATE POLICY "View routes" ON public.routes FOR SELECT USING (has_permission(auth.uid(), 'view_routes'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Edit routes" ON public.routes;
CREATE POLICY "Edit routes" ON public.routes FOR INSERT WITH CHECK (has_permission(auth.uid(), 'edit_routes'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Update routes" ON public.routes;
CREATE POLICY "Update routes" ON public.routes FOR UPDATE USING (has_permission(auth.uid(), 'edit_routes'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Delete routes" ON public.routes;
CREATE POLICY "Delete routes" ON public.routes FOR DELETE USING (has_permission(auth.uid(), 'delete_routes'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));

-- Cargo types
DROP POLICY IF EXISTS "View cargo_types" ON public.cargo_types;
CREATE POLICY "View cargo_types" ON public.cargo_types FOR SELECT USING (has_permission(auth.uid(), 'view_cargo_types'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Edit cargo_types" ON public.cargo_types;
CREATE POLICY "Edit cargo_types" ON public.cargo_types FOR INSERT WITH CHECK (has_permission(auth.uid(), 'edit_cargo_types'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Update cargo_types" ON public.cargo_types;
CREATE POLICY "Update cargo_types" ON public.cargo_types FOR UPDATE USING (has_permission(auth.uid(), 'edit_cargo_types'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Delete cargo_types" ON public.cargo_types;
CREATE POLICY "Delete cargo_types" ON public.cargo_types FOR DELETE USING (has_permission(auth.uid(), 'delete_cargo_types'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));

-- Trips
DROP POLICY IF EXISTS "View trips" ON public.trips;
CREATE POLICY "View trips" ON public.trips FOR SELECT USING (has_permission(auth.uid(), 'view_trips'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Edit trips" ON public.trips;
CREATE POLICY "Edit trips" ON public.trips FOR INSERT WITH CHECK (has_permission(auth.uid(), 'edit_trips'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Update trips" ON public.trips;
CREATE POLICY "Update trips" ON public.trips FOR UPDATE USING (has_permission(auth.uid(), 'edit_trips'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Delete trips" ON public.trips;
CREATE POLICY "Delete trips" ON public.trips FOR DELETE USING (has_permission(auth.uid(), 'delete_trips'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));

DROP POLICY IF EXISTS "Drivers can view own assigned trips" ON public.trips;
CREATE POLICY "Drivers can view own assigned trips" ON public.trips FOR SELECT USING (id IN (SELECT get_driver_trips(auth.uid())));
DROP POLICY IF EXISTS "Drivers can update own trip status" ON public.trips;
CREATE POLICY "Drivers can update own trip status" ON public.trips FOR UPDATE USING (id IN (SELECT get_driver_trips(auth.uid())) AND has_permission(auth.uid(), 'update_trip_status'::app_permission));

-- Trip templates
DROP POLICY IF EXISTS "Users can view all templates" ON public.trip_templates;
CREATE POLICY "Users can view all templates" ON public.trip_templates FOR SELECT USING (has_permission(auth.uid(), 'view_trips'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Users can create templates" ON public.trip_templates;
CREATE POLICY "Users can create templates" ON public.trip_templates FOR INSERT WITH CHECK (has_permission(auth.uid(), 'edit_trips'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Users can update templates" ON public.trip_templates;
CREATE POLICY "Users can update templates" ON public.trip_templates FOR UPDATE USING (has_permission(auth.uid(), 'edit_trips'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));
DROP POLICY IF EXISTS "Users can delete templates" ON public.trip_templates;
CREATE POLICY "Users can delete templates" ON public.trip_templates FOR DELETE USING (has_permission(auth.uid(), 'edit_trips'::app_permission) AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_global_admin(auth.uid())));

-- 14. Permissions for global_admin
INSERT INTO public.role_permissions (role, permission)
SELECT 'global_admin'::app_role, unnest(enum_range(NULL::app_permission))
ON CONFLICT DO NOTHING;

-- 15. Triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_members_updated_at BEFORE UPDATE ON public.company_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Update handle_new_user to set current_company_id (new users won't have a company yet)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'dispatcher');
  
  RETURN NEW;
END;
$$;
