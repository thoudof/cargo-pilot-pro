-- Исправление функции update_updated_at_column - добавление search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Исправление функции handle_new_user - добавление search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'dispatcher');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Удаление слишком разрешающих политик и замена на более строгие
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create activity_logs" ON public.activity_logs;

-- Создание более строгих политик для notifications
CREATE POLICY "Authenticated users can create own notifications" ON public.notifications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Для activity_logs - только аутентифицированные пользователи могут создавать записи о своих действиях
CREATE POLICY "Authenticated users can create activity_logs" ON public.activity_logs 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);