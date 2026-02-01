-- Trip templates table for quick trip creation
CREATE TABLE public.trip_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  route_id UUID REFERENCES public.routes(id),
  contractor_id UUID REFERENCES public.contractors(id),
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  cargo_type_id UUID REFERENCES public.cargo_types(id),
  point_a TEXT,
  point_b TEXT,
  cargo_description TEXT,
  cargo_weight NUMERIC,
  cargo_volume NUMERIC,
  cargo_value NUMERIC,
  default_expenses JSONB DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for trip_templates
CREATE POLICY "Users can view all templates"
  ON public.trip_templates
  FOR SELECT
  USING (has_permission(auth.uid(), 'view_trips'::app_permission));

CREATE POLICY "Users can create templates"
  ON public.trip_templates
  FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'edit_trips'::app_permission));

CREATE POLICY "Users can update templates"
  ON public.trip_templates
  FOR UPDATE
  USING (has_permission(auth.uid(), 'edit_trips'::app_permission));

CREATE POLICY "Users can delete templates"
  ON public.trip_templates
  FOR DELETE
  USING (has_permission(auth.uid(), 'edit_trips'::app_permission));

-- User dashboard settings table
CREATE TABLE public.user_dashboard_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  widget_layout JSONB DEFAULT '[]'::jsonb,
  hidden_widgets TEXT[] DEFAULT '{}',
  theme_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for dashboard settings
CREATE POLICY "Users can view own settings"
  ON public.user_dashboard_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own settings"
  ON public.user_dashboard_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_dashboard_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_trip_templates_updated_at
  BEFORE UPDATE ON public.trip_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_settings_updated_at
  BEFORE UPDATE ON public.user_dashboard_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();