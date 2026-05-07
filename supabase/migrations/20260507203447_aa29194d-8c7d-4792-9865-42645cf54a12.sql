
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS telegram_chat_id text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read boolean NOT NULL DEFAULT false;

-- Make user_id nullable on tenant tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'trips','drivers','vehicles','contractors','routes','cargo_types',
    'trip_expenses','trip_documents','document_templates'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id DROP NOT NULL', t);
  END LOOP;
END $$;

-- Sync read <-> is_read via trigger
CREATE OR REPLACE FUNCTION public.sync_notification_read()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.read IS DISTINCT FROM OLD.read OR OLD IS NULL THEN
      NEW.is_read := NEW.read;
    END IF;
    IF NEW.is_read IS DISTINCT FROM OLD.is_read OR OLD IS NULL THEN
      NEW.read := NEW.is_read;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_notification_read ON public.notifications;
CREATE TRIGGER sync_notification_read BEFORE INSERT OR UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_notification_read();
