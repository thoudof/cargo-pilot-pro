-- Включаем RLS на view activity_logs_safe
ALTER VIEW public.activity_logs_safe SET (security_barrier = true);

-- Для view нужно создать политики через базовую таблицу
-- Но так как view использует security_invoker, RLS наследуется от activity_logs
-- Добавляем явную защиту через GRANT/REVOKE

-- Отзываем доступ у всех
REVOKE ALL ON public.activity_logs_safe FROM PUBLIC;
REVOKE ALL ON public.activity_logs_safe FROM anon;

-- Даём доступ только аутентифицированным (RLS activity_logs отфильтрует не-админов)
GRANT SELECT ON public.activity_logs_safe TO authenticated;