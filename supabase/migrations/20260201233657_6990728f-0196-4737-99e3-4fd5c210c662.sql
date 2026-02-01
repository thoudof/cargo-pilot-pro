-- Исправляем view на security_invoker вместо security_definer
DROP VIEW IF EXISTS public.activity_logs_safe;

-- Создаем view с security_invoker (безопасный вариант)
CREATE VIEW public.activity_logs_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  action,
  entity_type,
  entity_id,
  -- IP и user_agent видны только админам через RLS на базовой таблице
  ip_address,
  user_agent,
  details,
  created_at
FROM public.activity_logs;

-- Права на view
GRANT SELECT ON public.activity_logs_safe TO authenticated;