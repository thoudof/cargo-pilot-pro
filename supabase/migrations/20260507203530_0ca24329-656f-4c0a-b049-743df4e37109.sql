
-- Add power_of_attorney enum value
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'power_of_attorney';

-- Profiles telegram link
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_link_code text,
  ADD COLUMN IF NOT EXISTS telegram_link_code_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text;

-- Trip documents file_name alias
ALTER TABLE public.trip_documents ADD COLUMN IF NOT EXISTS file_name text;
UPDATE public.trip_documents SET file_name = COALESCE(file_name, document_name);

-- Trip expenses aliases for category/date/created_by used by code
ALTER TABLE public.trip_expenses
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS date timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Make legacy NOT NULL columns optional via defaults
ALTER TABLE public.trip_expenses ALTER COLUMN expense_type DROP NOT NULL;
ALTER TABLE public.trip_expenses ALTER COLUMN expense_date DROP NOT NULL;

-- Sync trigger so either field set works
CREATE OR REPLACE FUNCTION public.sync_trip_expense_fields()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.category := COALESCE(NEW.category, NEW.expense_type);
  NEW.expense_type := COALESCE(NEW.expense_type, NEW.category, 'other');
  NEW.date := COALESCE(NEW.date, NEW.expense_date, now());
  NEW.expense_date := COALESCE(NEW.expense_date, NEW.date, now());
  NEW.created_by := COALESCE(NEW.created_by, NEW.user_id);
  NEW.user_id := COALESCE(NEW.user_id, NEW.created_by);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_trip_expense_fields ON public.trip_expenses;
CREATE TRIGGER sync_trip_expense_fields BEFORE INSERT OR UPDATE ON public.trip_expenses
  FOR EACH ROW EXECUTE FUNCTION public.sync_trip_expense_fields();

-- Sync trip_documents file_name <-> document_name
CREATE OR REPLACE FUNCTION public.sync_trip_doc_name()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.document_name := COALESCE(NEW.document_name, NEW.file_name, 'document');
  NEW.file_name := COALESCE(NEW.file_name, NEW.document_name);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_trip_doc_name ON public.trip_documents;
CREATE TRIGGER sync_trip_doc_name BEFORE INSERT OR UPDATE ON public.trip_documents
  FOR EACH ROW EXECUTE FUNCTION public.sync_trip_doc_name();

-- Add FK from trip_templates -> routes (so PostgREST can join `routes(...)`)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trip_templates_route_id_fkey'
  ) THEN
    ALTER TABLE public.trip_templates
      ADD CONSTRAINT trip_templates_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trip_templates_contractor_id_fkey') THEN
    ALTER TABLE public.trip_templates ADD CONSTRAINT trip_templates_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trip_templates_driver_id_fkey') THEN
    ALTER TABLE public.trip_templates ADD CONSTRAINT trip_templates_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trip_templates_vehicle_id_fkey') THEN
    ALTER TABLE public.trip_templates ADD CONSTRAINT trip_templates_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trip_templates_cargo_type_id_fkey') THEN
    ALTER TABLE public.trip_templates ADD CONSTRAINT trip_templates_cargo_type_id_fkey FOREIGN KEY (cargo_type_id) REFERENCES public.cargo_types(id) ON DELETE SET NULL;
  END IF;
END $$;
