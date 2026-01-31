-- Create enum for notification event types
CREATE TYPE public.notification_event_type AS ENUM (
  'trip_created',
  'trip_updated', 
  'trip_status_changed',
  'trip_deleted',
  'driver_created',
  'driver_updated',
  'driver_deleted',
  'vehicle_created',
  'vehicle_updated',
  'vehicle_deleted',
  'expense_created',
  'document_uploaded'
);

-- Create table for admin telegram subscriptions
CREATE TABLE public.admin_telegram_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  telegram_chat_id TEXT NOT NULL,
  event_types notification_event_type[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_admin_telegram_active ON public.admin_telegram_subscriptions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.admin_telegram_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own subscriptions"
ON public.admin_telegram_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions"
ON public.admin_telegram_subscriptions
FOR ALL
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_admin_telegram_subscriptions_updated_at
BEFORE UPDATE ON public.admin_telegram_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add telegram_link_code fields to profiles for admin linking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_link_code TEXT,
ADD COLUMN IF NOT EXISTS telegram_link_code_expires_at TIMESTAMP WITH TIME ZONE;