
-- Step 1: Add global_admin to app_role enum only
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'global_admin';
