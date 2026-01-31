-- Create table for GPS tracking / trip locations
CREATE TABLE public.trip_locations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    speed DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    altitude DECIMAL(10, 2),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for fast lookups
CREATE INDEX idx_trip_locations_trip_id ON public.trip_locations(trip_id);
CREATE INDEX idx_trip_locations_recorded_at ON public.trip_locations(recorded_at DESC);
CREATE INDEX idx_trip_locations_user_id ON public.trip_locations(user_id);

-- Enable RLS
ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for trip_locations
CREATE POLICY "Drivers can insert own locations"
ON public.trip_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Drivers can view own trip locations"
ON public.trip_locations
FOR SELECT
USING (
    auth.uid() = user_id 
    OR has_permission(auth.uid(), 'view_trips'::app_permission)
);

CREATE POLICY "Managers can view all locations"
ON public.trip_locations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dispatcher'::app_role));

-- Create table to link users to drivers (for driver accounts)
CREATE TABLE public.driver_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(driver_id)
);

-- Enable RLS on driver_users
ALTER TABLE public.driver_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own driver link"
ON public.driver_users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage driver_users"
ON public.driver_users
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default permissions for driver role
INSERT INTO public.role_permissions (role, permission) VALUES
    ('driver', 'view_own_trips'),
    ('driver', 'update_trip_status'),
    ('driver', 'update_trip_location'),
    ('driver', 'view_own_expenses'),
    ('driver', 'add_own_expenses'),
    ('driver', 'view_routes')
ON CONFLICT DO NOTHING;

-- Create function to get driver's assigned trips
CREATE OR REPLACE FUNCTION public.get_driver_trips(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT t.id 
    FROM trips t
    JOIN driver_users du ON du.driver_id = t.driver_id
    WHERE du.user_id = _user_id
$$;

-- Add RLS policy for drivers to view their own trips
CREATE POLICY "Drivers can view own assigned trips"
ON public.trips
FOR SELECT
USING (
    id IN (SELECT get_driver_trips(auth.uid()))
    OR has_permission(auth.uid(), 'view_trips'::app_permission)
);

-- Add RLS policy for drivers to update trip status
CREATE POLICY "Drivers can update own trip status"
ON public.trips
FOR UPDATE
USING (
    id IN (SELECT get_driver_trips(auth.uid()))
    AND has_permission(auth.uid(), 'update_trip_status'::app_permission)
);