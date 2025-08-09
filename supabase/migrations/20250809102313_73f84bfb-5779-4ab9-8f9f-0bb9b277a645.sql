-- Crear tabla para categorías de chat
CREATE TABLE IF NOT EXISTS public.chat_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar categorías predefinidas
INSERT INTO public.chat_categories (name, description, keywords) VALUES
('tramites', 'Consultas sobre trámites y gestiones administrativas', ARRAY['trámite', 'tramite', 'certificado', 'licencia', 'permiso', 'documentación', 'gestión', 'registro', 'solicitud', 'papeles']),
('eventos', 'Información sobre eventos y actividades', ARRAY['evento', 'actividad', 'festival', 'concierto', 'fiesta', 'celebración', 'cultural', 'deportivo', 'música', 'teatro']),
('lugares', 'Información sobre sitios y lugares de interés', ARRAY['lugar', 'sitio', 'dirección', 'ubicación', 'dónde', 'donde', 'cómo llegar', 'museo', 'parque', 'playa', 'restaurante']),
('informacion_general', 'Consultas generales sobre la ciudad', ARRAY['información', 'informacion', 'general', 'ayuda', 'contacto', 'horario', 'teléfono', 'telefono', 'email', 'web']),
('turismo', 'Información turística y de ocio', ARRAY['turismo', 'visitar', 'tourist', 'hotel', 'alojamiento', 'excursión', 'tour', 'guía', 'vacaciones', 'ocio'])
ON CONFLICT (name) DO NOTHING;

-- Crear tabla para métricas de chat por ciudad
CREATE TABLE IF NOT EXISTS public.chat_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  message_content TEXT,
  message_type TEXT CHECK (message_type IN ('user', 'assistant')),
  category_id UUID REFERENCES chat_categories(id) ON DELETE SET NULL,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date_key DATE GENERATED ALWAYS AS (created_at::date) STORED,
  hour_key INTEGER GENERATED ALWAYS AS (EXTRACT(hour FROM created_at)) STORED
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_analytics_city_date ON chat_analytics(city_id, date_key);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_category ON chat_analytics(category_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_created_at ON chat_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_hour_key ON chat_analytics(hour_key);

-- Crear tabla para métricas agregadas por día
CREATE TABLE IF NOT EXISTS public.daily_chat_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  date_key DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  user_messages INTEGER DEFAULT 0,
  assistant_messages INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  avg_response_time_ms NUMERIC DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(city_id, date_key)
);

-- Crear función para clasificar mensajes automáticamente
CREATE OR REPLACE FUNCTION public.classify_message(message_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  category_record RECORD;
  keyword TEXT;
  message_lower TEXT := lower(message_text);
BEGIN
  -- Buscar en cada categoría
  FOR category_record IN 
    SELECT id, keywords FROM chat_categories 
  LOOP
    -- Buscar cada palabra clave en el mensaje
    FOREACH keyword IN ARRAY category_record.keywords
    LOOP
      IF position(lower(keyword) IN message_lower) > 0 THEN
        RETURN category_record.id;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Si no encuentra ninguna categoría, devolver 'informacion_general'
  RETURN (SELECT id FROM chat_categories WHERE name = 'informacion_general');
END;
$$;

-- Crear función para actualizar métricas diarias
CREATE OR REPLACE FUNCTION public.update_daily_metrics(target_city_id UUID, target_date DATE)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO daily_chat_metrics (
    city_id,
    date_key,
    total_messages,
    user_messages,
    assistant_messages,
    unique_users,
    unique_sessions,
    avg_response_time_ms,
    total_tokens_used,
    updated_at
  )
  SELECT 
    target_city_id,
    target_date,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE message_type = 'user') as user_messages,
    COUNT(*) FILTER (WHERE message_type = 'assistant') as assistant_messages,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(response_time_ms) as avg_response_time_ms,
    SUM(tokens_used) as total_tokens_used,
    now()
  FROM chat_analytics 
  WHERE city_id = target_city_id 
    AND date_key = target_date
  ON CONFLICT (city_id, date_key) 
  DO UPDATE SET
    total_messages = EXCLUDED.total_messages,
    user_messages = EXCLUDED.user_messages,
    assistant_messages = EXCLUDED.assistant_messages,
    unique_users = EXCLUDED.unique_users,
    unique_sessions = EXCLUDED.unique_sessions,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    total_tokens_used = EXCLUDED.total_tokens_used,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Crear trigger para actualizar métricas diarias automáticamente
CREATE OR REPLACE FUNCTION public.trigger_update_daily_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Actualizar métricas para la fecha del nuevo registro
  PERFORM update_daily_metrics(NEW.city_id, NEW.date_key);
  RETURN NEW;
END;
$$;

CREATE TRIGGER chat_analytics_update_daily_metrics
  AFTER INSERT ON chat_analytics
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_daily_metrics();

-- Habilitar RLS para las tablas
ALTER TABLE chat_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_chat_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_categories (lectura pública)
CREATE POLICY "Anyone can read chat categories"
  ON chat_categories FOR SELECT
  USING (true);

-- Políticas RLS para chat_analytics
CREATE POLICY "City admins can read their city analytics"
  ON chat_analytics FOR SELECT
  USING (
    city_id IN (
      SELECT id FROM cities WHERE admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert analytics"
  ON chat_analytics FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para daily_chat_metrics
CREATE POLICY "City admins can read their city daily metrics"
  ON daily_chat_metrics FOR SELECT
  USING (
    city_id IN (
      SELECT id FROM cities WHERE admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage daily metrics"
  ON daily_chat_metrics FOR ALL
  USING (true);