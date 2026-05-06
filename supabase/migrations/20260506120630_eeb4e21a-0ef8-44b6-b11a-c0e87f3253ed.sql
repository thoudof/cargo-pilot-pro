DO $$ BEGIN
CREATE TYPE public.app_role AS ENUM ('admin', 'dispatcher', 'driver', 'global_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE TYPE public.app_permission AS ENUM (
    'view_trips', 'edit_trips', 'delete_trips',
    'view_contractors', 'edit_contractors', 'delete_contractors',
    'view_drivers', 'edit_drivers', 'delete_drivers',
    'view_vehicles', 'edit_vehicles', 'delete_vehicles',
    'view_routes', 'edit_routes', 'delete_routes',
    'view_cargo_types', 'edit_cargo_types', 'delete_cargo_types',
    'view_reports', 'view_admin_panel', 'view_finances', 'view_statistics',
    'manage_users', 'view_documents', 'edit_documents', 'delete_documents',
    'view_expenses', 'edit_expenses', 'delete_expenses',
    'manage_document_templates', 'manage_system', 'view_analytics', 'export_data'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE TYPE public.document_type AS ENUM (
  'act', 'invoice', 'receipt', 'contract', 'transport_waybill',
  'customs_declaration', 'insurance', 'certificate', 'permit', 'other'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE TYPE public.notification_event_type AS ENUM (
  'trip_created','trip_updated','trip_status_changed','trip_deleted',
  'driver_created','driver_updated','driver_deleted',
  'vehicle_created','vehicle_updated','vehicle_deleted',
  'expense_created','document_uploaded'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;