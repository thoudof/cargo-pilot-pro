
-- 1. Создаем перечисление (enum) для всех возможных прав в системе.
CREATE TYPE public.app_permission AS ENUM (
    'view_trips',
    'edit_trips',
    'view_contractors',
    'edit_contractors',
    'view_drivers',
    'edit_drivers',
    'view_vehicles',
    'edit_vehicles',
    'view_routes',
    'edit_routes',
    'view_cargo_types',
    'edit_cargo_types',
    'view_reports',
    'view_admin_panel',
    'view_finances',
    'view_statistics',
    'manage_users'
);

-- 2. Создаем таблицу `role_permissions` для связи ролей с их правами.
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  permission public.app_permission NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission)
);

-- 3. Включаем защиту на уровне строк (RLS).
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 4. Политики RLS: все могут читать права, но изменять их могут только администраторы.
CREATE POLICY "Allow authenticated users to read role_permissions"
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage role_permissions"
  ON public.role_permissions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Наполняем таблицу правами для каждой роли.
-- Администратор получает все права.
INSERT INTO public.role_permissions (role, permission)
SELECT 'admin', permission
FROM unnest(enum_range(NULL::public.app_permission)) AS permission
ON CONFLICT (role, permission) DO NOTHING;

-- Диспетчер получает права на управление основными сущностями.
INSERT INTO public.role_permissions (role, permission)
VALUES
    ('dispatcher', 'view_trips'),
    ('dispatcher', 'edit_trips'),
    ('dispatcher', 'view_contractors'),
    ('dispatcher', 'edit_contractors'),
    ('dispatcher', 'view_drivers'),
    ('dispatcher', 'edit_drivers'),
    ('dispatcher', 'view_vehicles'),
    ('dispatcher', 'edit_vehicles'),
    ('dispatcher', 'view_routes'),
    ('dispatcher', 'edit_routes'),
    ('dispatcher', 'view_cargo_types'),
    ('dispatcher', 'edit_cargo_types'),
    ('dispatcher', 'view_reports')
ON CONFLICT (role, permission) DO NOTHING;

-- Водитель получает права только на просмотр рейсов и маршрутов.
INSERT INTO public.role_permissions (role, permission)
VALUES
    ('driver', 'view_trips'),
    ('driver', 'view_routes')
ON CONFLICT (role, permission) DO NOTHING;

-- 6. Создаем новую функцию `has_permission` для проверки наличия права у пользователя.
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission public.app_permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  )
$$;
