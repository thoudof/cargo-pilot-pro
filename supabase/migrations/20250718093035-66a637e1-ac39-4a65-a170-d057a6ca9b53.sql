-- Добавляем новые значения в enum app_permission по одному
ALTER TYPE public.app_permission ADD VALUE 'view_documents';
ALTER TYPE public.app_permission ADD VALUE 'edit_documents';
ALTER TYPE public.app_permission ADD VALUE 'manage_document_templates';
ALTER TYPE public.app_permission ADD VALUE 'delete_documents';
ALTER TYPE public.app_permission ADD VALUE 'view_expenses';
ALTER TYPE public.app_permission ADD VALUE 'edit_expenses';
ALTER TYPE public.app_permission ADD VALUE 'delete_expenses';
ALTER TYPE public.app_permission ADD VALUE 'manage_system';
ALTER TYPE public.app_permission ADD VALUE 'view_analytics';
ALTER TYPE public.app_permission ADD VALUE 'export_data';