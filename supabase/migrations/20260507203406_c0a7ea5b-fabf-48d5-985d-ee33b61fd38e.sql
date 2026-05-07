
-- Add missing columns to document_templates
ALTER TABLE public.document_templates
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- =========================================================================
-- trip_templates
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.trip_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  description text,
  route_id uuid,
  contractor_id uuid,
  driver_id uuid,
  vehicle_id uuid,
  cargo_type_id uuid,
  point_a text,
  point_b text,
  cargo_description text,
  cargo_weight numeric,
  cargo_volume numeric,
  cargo_value numeric,
  is_favorite boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trip_templates_company_all" ON public.trip_templates;
CREATE POLICY "trip_templates_company_all" ON public.trip_templates
  FOR ALL TO authenticated
  USING (public.is_global_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_global_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id));
DROP TRIGGER IF EXISTS set_updated_at ON public.trip_templates;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.trip_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- trip_locations
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.trip_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL,
  driver_id uuid,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  speed numeric,
  heading numeric,
  accuracy numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trip_locations_trip ON public.trip_locations(trip_id, recorded_at);
ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trip_locations_select_via_trip" ON public.trip_locations;
CREATE POLICY "trip_locations_select_via_trip" ON public.trip_locations
  FOR SELECT TO authenticated
  USING (
    public.is_global_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND public.is_company_member(auth.uid(), t.company_id))
  );
DROP POLICY IF EXISTS "trip_locations_insert_authenticated" ON public.trip_locations;
CREATE POLICY "trip_locations_insert_authenticated" ON public.trip_locations
  FOR INSERT TO authenticated WITH CHECK (true);

-- =========================================================================
-- driver_users
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.driver_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  driver_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "driver_users_select_self_or_admin" ON public.driver_users;
CREATE POLICY "driver_users_select_self_or_admin" ON public.driver_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_global_admin(auth.uid()));
DROP POLICY IF EXISTS "driver_users_admin_write" ON public.driver_users;
CREATE POLICY "driver_users_admin_write" ON public.driver_users
  FOR ALL TO authenticated
  USING (public.is_global_admin(auth.uid()))
  WITH CHECK (public.is_global_admin(auth.uid()));

-- =========================================================================
-- admin_telegram_subscriptions
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.admin_telegram_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  telegram_chat_id text,
  telegram_username text,
  event_types text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  verification_code text,
  verification_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_telegram_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ats_own" ON public.admin_telegram_subscriptions;
CREATE POLICY "ats_own" ON public.admin_telegram_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_global_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_global_admin(auth.uid()));
DROP TRIGGER IF EXISTS set_updated_at ON public.admin_telegram_subscriptions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.admin_telegram_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- user_dashboard_settings
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_dashboard_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  widget_layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden_widgets text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_dashboard_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "uds_own" ON public.user_dashboard_settings;
CREATE POLICY "uds_own" ON public.user_dashboard_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP TRIGGER IF EXISTS set_updated_at ON public.user_dashboard_settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_dashboard_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
