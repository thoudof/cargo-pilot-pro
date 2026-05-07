
-- =========================================================================
-- HELPER FUNCTIONS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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
  );
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'global_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission public.app_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_global_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = _user_id
        AND permission = _permission
        AND (expires_at IS NULL OR expires_at > now())
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON rp.role = ur.role
      WHERE ur.user_id = _user_id AND rp.permission = _permission
    );
$$;

-- =========================================================================
-- COMPANIES (multi-tenant)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  inn text,
  address text,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.company_members
  WHERE user_id = auth.uid()
  ORDER BY is_default DESC, created_at ASC
  LIMIT 1;
$$;

-- =========================================================================
-- ADD company_id TO EXISTING TABLES
-- =========================================================================

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'trips','drivers','vehicles','contractors','routes',
    'cargo_types','trip_expenses','trip_documents',
    'document_templates','notifications'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id uuid', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_company ON public.%I(company_id)', t, t);
  END LOOP;
END $$;

-- =========================================================================
-- TRIGGER: auto-create profile + assign default company
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_company_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- attach to test company by default
  INSERT INTO public.company_members (company_id, user_id, role, is_default)
  VALUES (default_company_id, NEW.id, 'member', true)
  ON CONFLICT (company_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- updated_at TRIGGERS
-- =========================================================================

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'companies','profiles','trips','drivers','vehicles','contractors',
    'routes','cargo_types','trip_expenses','trip_documents',
    'document_templates','notifications','user_roles','contacts'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;

-- =========================================================================
-- RLS POLICIES
-- =========================================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_global_admin(auth.uid()));
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- user_roles (only global_admin can manage; users can read own)
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_global_admin(auth.uid()));
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_global_admin(auth.uid()))
  WITH CHECK (public.is_global_admin(auth.uid()));

-- user_permissions
DROP POLICY IF EXISTS "user_permissions_select" ON public.user_permissions;
CREATE POLICY "user_permissions_select" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_global_admin(auth.uid()));
DROP POLICY IF EXISTS "user_permissions_admin_all" ON public.user_permissions;
CREATE POLICY "user_permissions_admin_all" ON public.user_permissions
  FOR ALL TO authenticated
  USING (public.is_global_admin(auth.uid()))
  WITH CHECK (public.is_global_admin(auth.uid()));

-- role_permissions (read by authenticated, write by global_admin)
DROP POLICY IF EXISTS "role_permissions_select" ON public.role_permissions;
CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "role_permissions_admin_write" ON public.role_permissions;
CREATE POLICY "role_permissions_admin_write" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.is_global_admin(auth.uid()))
  WITH CHECK (public.is_global_admin(auth.uid()));

-- companies
DROP POLICY IF EXISTS "companies_select_member_or_admin" ON public.companies;
CREATE POLICY "companies_select_member_or_admin" ON public.companies
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), id) OR public.is_global_admin(auth.uid()));
DROP POLICY IF EXISTS "companies_admin_all" ON public.companies;
CREATE POLICY "companies_admin_all" ON public.companies
  FOR ALL TO authenticated
  USING (public.is_global_admin(auth.uid()))
  WITH CHECK (public.is_global_admin(auth.uid()));
DROP POLICY IF EXISTS "companies_insert_authenticated" ON public.companies;
CREATE POLICY "companies_insert_authenticated" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- company_members
DROP POLICY IF EXISTS "company_members_select_self_or_admin" ON public.company_members;
CREATE POLICY "company_members_select_self_or_admin" ON public.company_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_global_admin(auth.uid()));
DROP POLICY IF EXISTS "company_members_admin_all" ON public.company_members;
CREATE POLICY "company_members_admin_all" ON public.company_members
  FOR ALL TO authenticated
  USING (public.is_global_admin(auth.uid()))
  WITH CHECK (public.is_global_admin(auth.uid()));

-- Generic tenant-isolated tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'trips','drivers','vehicles','contractors','routes','cargo_types',
    'trip_expenses','trip_documents','document_templates'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_company" ON public.%I', t, t);
    EXECUTE format($p$CREATE POLICY "%s_select_company" ON public.%I FOR SELECT TO authenticated USING (public.is_global_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id))$p$, t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_company" ON public.%I', t, t);
    EXECUTE format($p$CREATE POLICY "%s_insert_company" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_global_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id))$p$, t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update_company" ON public.%I', t, t);
    EXECUTE format($p$CREATE POLICY "%s_update_company" ON public.%I FOR UPDATE TO authenticated USING (public.is_global_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id))$p$, t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete_company" ON public.%I', t, t);
    EXECUTE format($p$CREATE POLICY "%s_delete_company" ON public.%I FOR DELETE TO authenticated USING (public.is_global_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id))$p$, t, t);
  END LOOP;
END $$;

-- contacts (linked via contractor)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_all_via_contractor" ON public.contacts;
CREATE POLICY "contacts_all_via_contractor" ON public.contacts
  FOR ALL TO authenticated
  USING (
    public.is_global_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND public.is_company_member(auth.uid(), c.company_id))
  )
  WITH CHECK (
    public.is_global_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.contractors c WHERE c.id = contractor_id AND public.is_company_member(auth.uid(), c.company_id))
  );

-- notifications (per-user)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_global_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_global_admin(auth.uid()));

-- push_tokens (per-user)
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_tokens_own" ON public.push_tokens;
CREATE POLICY "push_tokens_own" ON public.push_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- activity_logs (insert by self, read by global_admin)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_logs_insert_self" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_self" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "activity_logs_select_admin" ON public.activity_logs;
CREATE POLICY "activity_logs_select_admin" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_global_admin(auth.uid()));

-- =========================================================================
-- STORAGE BUCKETS
-- =========================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents','documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars','avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_user_write" ON storage.objects;
CREATE POLICY "avatars_user_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;
CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "documents_user_read" ON storage.objects;
CREATE POLICY "documents_user_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_global_admin(auth.uid())));

DROP POLICY IF EXISTS "documents_user_write" ON storage.objects;
CREATE POLICY "documents_user_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "documents_user_update" ON storage.objects;
CREATE POLICY "documents_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "documents_user_delete" ON storage.objects;
CREATE POLICY "documents_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================================================================
-- SEED: test company + role permissions
-- =========================================================================

INSERT INTO public.companies (id, name, inn, address, phone, email, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Тестовое юрлицо',
  '0000000000',
  'г. Москва, тестовый адрес',
  '+7 000 000-00-00',
  'test@example.com',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Seed default role permissions (admin gets all, dispatcher gets view/edit basics)
INSERT INTO public.role_permissions (role, permission)
SELECT 'admin'::public.app_role, p::public.app_permission
FROM unnest(enum_range(NULL::public.app_permission)) AS p
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT 'global_admin'::public.app_role, p::public.app_permission
FROM unnest(enum_range(NULL::public.app_permission)) AS p
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission) VALUES
  ('dispatcher','view_trips'),
  ('dispatcher','edit_trips'),
  ('dispatcher','view_contractors'),
  ('dispatcher','view_drivers'),
  ('dispatcher','view_vehicles'),
  ('dispatcher','view_routes'),
  ('dispatcher','view_cargo_types'),
  ('dispatcher','view_reports')
ON CONFLICT DO NOTHING;
