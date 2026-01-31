-- Add telegram_chat_id to drivers table
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS telegram_chat_id text;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS telegram_link_code text;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS telegram_link_code_expires_at timestamp with time zone;

-- Create index for faster lookup by telegram_chat_id
CREATE INDEX IF NOT EXISTS idx_drivers_telegram_chat_id ON public.drivers(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- Create index for link code lookup
CREATE INDEX IF NOT EXISTS idx_drivers_telegram_link_code ON public.drivers(telegram_link_code) WHERE telegram_link_code IS NOT NULL;

-- Add telegram notifications preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_notifications_enabled boolean DEFAULT true;