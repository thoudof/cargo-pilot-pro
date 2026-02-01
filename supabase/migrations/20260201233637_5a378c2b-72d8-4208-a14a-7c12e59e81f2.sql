-- 1. Улучшаем защиту trip_expenses - ограничиваем доступ по ролям
-- Удаляем старые политики
DROP POLICY IF EXISTS "View trip_expenses" ON public.trip_expenses;
DROP POLICY IF EXISTS "Edit trip_expenses" ON public.trip_expenses;
DROP POLICY IF EXISTS "Update trip_expenses" ON public.trip_expenses;
DROP POLICY IF EXISTS "Delete trip_expenses" ON public.trip_expenses;

-- Создаем более строгие политики: только admin и dispatcher могут видеть все расходы
CREATE POLICY "Admins and dispatchers view all expenses" 
ON public.trip_expenses 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'dispatcher')
);

-- Водители могут видеть только расходы по своим рейсам
CREATE POLICY "Drivers view own trip expenses" 
ON public.trip_expenses 
FOR SELECT 
USING (
  trip_id IN (SELECT get_driver_trips(auth.uid()))
);

-- Создание расходов - admin, dispatcher или водитель для своих рейсов
CREATE POLICY "Create trip_expenses" 
ON public.trip_expenses 
FOR INSERT 
WITH CHECK (
  has_permission(auth.uid(), 'edit_expenses') OR 
  (has_permission(auth.uid(), 'add_own_expenses') AND trip_id IN (SELECT get_driver_trips(auth.uid())))
);

-- Обновление расходов - только admin и dispatcher
CREATE POLICY "Update trip_expenses restricted" 
ON public.trip_expenses 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'dispatcher')
);

-- Удаление - только admin
CREATE POLICY "Delete trip_expenses admin only" 
ON public.trip_expenses 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 2. Улучшаем защиту activity_logs - добавляем политику автоочистки через 90 дней
-- Создаем функцию для очистки старых логов
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.activity_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Добавляем индекс для быстрой очистки
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON public.activity_logs(created_at);

-- Скрываем IP адреса для не-админов через view
CREATE OR REPLACE VIEW public.activity_logs_safe AS
SELECT 
  id,
  user_id,
  action,
  entity_type,
  entity_id,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN ip_address 
    ELSE NULL 
  END as ip_address,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN user_agent 
    ELSE NULL 
  END as user_agent,
  details,
  created_at
FROM public.activity_logs;

-- Даем права на view
GRANT SELECT ON public.activity_logs_safe TO authenticated;