
-- Создание таблицы уведомлений
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('trip_created', 'trip_updated', 'trip_completed', 'trip_cancelled', 'document_added', 'system')),
  related_entity_id uuid,
  related_entity_type text CHECK (related_entity_type IN ('trip', 'contractor', 'driver', 'vehicle')),
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Политики безопасности для уведомлений
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Создание таблицы для PUSH токенов
CREATE TABLE public.push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Политики безопасности для PUSH токенов
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push tokens" ON public.push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Функция для создания уведомлений при изменении статуса рейса
CREATE OR REPLACE FUNCTION public.handle_trip_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Создаем уведомление при изменении статуса рейса
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_id, related_entity_type)
    VALUES (
      NEW.user_id,
      'Статус рейса изменен',
      CASE NEW.status
        WHEN 'in_progress' THEN 'Рейс ' || NEW.point_a || ' → ' || NEW.point_b || ' начат'
        WHEN 'completed' THEN 'Рейс ' || NEW.point_a || ' → ' || NEW.point_b || ' завершен'
        WHEN 'cancelled' THEN 'Рейс ' || NEW.point_a || ' → ' || NEW.point_b || ' отменен'
        ELSE 'Рейс ' || NEW.point_a || ' → ' || NEW.point_b || ' обновлен'
      END,
      'trip_updated',
      NEW.id,
      'trip'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Триггер для отслеживания изменений статуса рейса
CREATE TRIGGER on_trip_status_change
  AFTER UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_trip_status_change();

-- Функция для создания уведомлений при создании нового рейса
CREATE OR REPLACE FUNCTION public.handle_trip_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_entity_id, related_entity_type)
  VALUES (
    NEW.user_id,
    'Новый рейс создан',
    'Создан рейс ' || NEW.point_a || ' → ' || NEW.point_b || ' на ' || to_char(NEW.departure_date, 'DD.MM.YYYY'),
    'trip_created',
    NEW.id,
    'trip'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Триггер для уведомления о создании рейса
CREATE TRIGGER on_trip_created
  AFTER INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_trip_created();
