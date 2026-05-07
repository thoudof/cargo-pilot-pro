
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS telegram_notifications_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS telegram_link_code text,
  ADD COLUMN IF NOT EXISTS telegram_link_code_expires_at timestamptz;

ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'waybill';
