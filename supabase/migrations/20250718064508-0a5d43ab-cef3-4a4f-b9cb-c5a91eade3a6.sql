-- Создание перечисления типов документов
CREATE TYPE public.document_type AS ENUM (
  'act',              -- Акты
  'invoice',          -- Счета
  'receipt',          -- Квитанции
  'contract',         -- Договоры
  'transport_waybill', -- Товарно-транспортные накладные
  'customs_declaration', -- Таможенные декларации
  'insurance',        -- Страховые документы
  'certificate',      -- Сертификаты
  'permit',          -- Разрешения
  'other'            -- Прочие
);

-- Создание таблицы для хранения документов рейсов
CREATE TABLE public.trip_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  document_type document_type NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT, -- Путь к файлу в системе хранения
  file_url TEXT,  -- URL файла для внешних систем (например, Nextcloud)
  file_size BIGINT, -- Размер файла в байтах
  mime_type TEXT, -- MIME тип файла
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL, -- Кто загрузил документ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL -- Владелец документа
);

-- Создание индексов для оптимизации поиска
CREATE INDEX idx_trip_documents_trip_id ON public.trip_documents(trip_id);
CREATE INDEX idx_trip_documents_type ON public.trip_documents(document_type);
CREATE INDEX idx_trip_documents_user_id ON public.trip_documents(user_id);

-- Включение RLS
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;

-- Политики RLS
CREATE POLICY "Users can view their own trip documents" 
ON public.trip_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create trip documents for their trips" 
ON public.trip_documents 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = trip_documents.trip_id 
    AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own trip documents" 
ON public.trip_documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip documents" 
ON public.trip_documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Создание функции для обновления времени изменения
CREATE OR REPLACE FUNCTION public.update_trip_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера для автоматического обновления updated_at
CREATE TRIGGER update_trip_documents_updated_at
  BEFORE UPDATE ON public.trip_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trip_documents_updated_at();

-- Добавление внешних ключей
ALTER TABLE public.trip_documents 
ADD CONSTRAINT fk_trip_documents_trip_id 
FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;

-- Создание таблицы шаблонов документов для разных типов рейсов
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  document_type document_type NOT NULL,
  is_required BOOLEAN DEFAULT false,
  description TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS для шаблонов документов
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own document templates" 
ON public.document_templates 
FOR ALL 
USING (auth.uid() = user_id);

-- Функция для получения обязательных документов для рейса
CREATE OR REPLACE FUNCTION public.get_required_documents_for_trip(trip_uuid UUID)
RETURNS TABLE (
  template_id UUID,
  template_name TEXT,
  document_type document_type,
  is_uploaded BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.id,
    dt.name,
    dt.document_type,
    EXISTS(
      SELECT 1 FROM public.trip_documents td 
      WHERE td.trip_id = trip_uuid 
      AND td.document_type = dt.document_type
    ) as is_uploaded
  FROM public.document_templates dt
  WHERE dt.is_required = true
  AND dt.user_id = (SELECT user_id FROM public.trips WHERE id = trip_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;