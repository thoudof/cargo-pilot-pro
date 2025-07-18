-- Добавляем недостающие права для администратора
INSERT INTO public.role_permissions (role, permission) VALUES 
('admin', 'view_documents'),
('admin', 'edit_documents'),
('admin', 'manage_document_templates'),
('admin', 'delete_documents'),
('admin', 'view_expenses'),
('admin', 'edit_expenses'),
('admin', 'delete_expenses'),
('admin', 'manage_system'),
('admin', 'view_analytics'),
('admin', 'export_data')
ON CONFLICT (role, permission) DO NOTHING;

-- Права для диспетчера
INSERT INTO public.role_permissions (role, permission) VALUES 
('dispatcher', 'view_documents'),
('dispatcher', 'edit_documents'),
('dispatcher', 'view_expenses'),
('dispatcher', 'edit_expenses'),
('dispatcher', 'view_analytics'),
('dispatcher', 'export_data')
ON CONFLICT (role, permission) DO NOTHING;

-- Права для водителя
INSERT INTO public.role_permissions (role, permission) VALUES 
('driver', 'view_trips'),
('driver', 'view_documents'),
('driver', 'edit_documents'),
('driver', 'view_expenses')
ON CONFLICT (role, permission) DO NOTHING;

-- Создаем таблицу для индивидуальных прав пользователей
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  permission app_permission NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Включаем RLS для таблицы пользовательских прав
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Политики для user_permissions
CREATE POLICY "Admins can manage user permissions" 
ON public.user_permissions 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Обновляем функцию проверки прав
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission app_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    -- Проверяем права через роли
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  ) OR EXISTS (
    -- Проверяем индивидуальные права
    SELECT 1
    FROM public.user_permissions up
    WHERE up.user_id = _user_id 
    AND up.permission = _permission
    AND (up.expires_at IS NULL OR up.expires_at > now())
  )
$$;