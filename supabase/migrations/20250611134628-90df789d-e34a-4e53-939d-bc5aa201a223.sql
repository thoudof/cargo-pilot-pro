
-- Сначала удаляем старое ограничение на роли в profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Добавляем новое ограничение, которое включает роль admin
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'dispatcher', 'driver'));

-- Теперь добавляем роль администратора первому пользователю
DO $$
DECLARE
    first_user_id uuid;
BEGIN
    SELECT id INTO first_user_id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (first_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        UPDATE public.profiles 
        SET role = 'admin' 
        WHERE id = first_user_id;
    END IF;
END $$;
