
-- Создаем таблицу для расходов по рейсам
CREATE TABLE public.trip_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL, -- 'fuel', 'tolls', 'parking', 'maintenance', 'food', 'accommodation', 'other'
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  receipt_url TEXT, -- для хранения ссылки на чек/документ
  expense_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Добавляем индексы для оптимизации запросов
CREATE INDEX idx_trip_expenses_trip_id ON public.trip_expenses(trip_id);
CREATE INDEX idx_trip_expenses_user_id ON public.trip_expenses(user_id);
CREATE INDEX idx_trip_expenses_expense_type ON public.trip_expenses(expense_type);
CREATE INDEX idx_trip_expenses_expense_date ON public.trip_expenses(expense_date);

-- Включаем RLS
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS
CREATE POLICY "Users can view their own trip expenses" 
  ON public.trip_expenses 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own trip expenses" 
  ON public.trip_expenses 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own trip expenses" 
  ON public.trip_expenses 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own trip expenses" 
  ON public.trip_expenses 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Добавляем триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_trip_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trip_expenses_updated_at
  BEFORE UPDATE ON public.trip_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_expenses_updated_at();

-- Добавляем функцию для получения общих расходов по рейсу
CREATE OR REPLACE FUNCTION get_trip_total_expenses(trip_uuid UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.trip_expenses
    WHERE trip_id = trip_uuid
  );
END;
$$ LANGUAGE plpgsql STABLE;
