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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_analytics_city_date ON chat_analytics(city_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_chat_analytics_category ON chat_analytics(category_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_created_at ON chat_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_hour ON chat_analytics(EXTRACT(hour FROM created_at));

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