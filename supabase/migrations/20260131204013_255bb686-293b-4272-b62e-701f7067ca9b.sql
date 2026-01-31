-- Add new driver-specific permissions to enum
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'view_own_trips';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'update_trip_status';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'update_trip_location';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'view_own_expenses';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'add_own_expenses';