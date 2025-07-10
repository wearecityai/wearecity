-- Crear tabla admin_chats para gestionar los chats de cada admin
CREATE TABLE public.admin_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  chat_slug TEXT UNIQUE NOT NULL,
  chat_name TEXT NOT NULL DEFAULT 'Mi Chat',
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de configuración de finetuning para cada chat
CREATE TABLE public.admin_finetuning_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  chat_id UUID REFERENCES public.admin_chats(id) ON DELETE CASCADE,
  config_name TEXT NOT NULL DEFAULT 'Configuración Principal',
  assistant_name TEXT DEFAULT 'Asistente de Ciudad',
  system_instruction TEXT DEFAULT 'Eres un asistente inteligente que ayuda a los ciudadanos con información sobre la ciudad.',
  recommended_prompts JSONB DEFAULT '[]'::jsonb,
  service_tags JSONB DEFAULT '[]'::jsonb,
  enable_google_search BOOLEAN DEFAULT true,
  allow_map_display BOOLEAN DEFAULT true,
  allow_geolocation BOOLEAN DEFAULT true,
  current_language_code TEXT DEFAULT 'es',
  procedure_source_urls JSONB DEFAULT '[]'::jsonb,
  uploaded_procedure_documents JSONB DEFAULT '[]'::jsonb,
  sede_electronica_url TEXT,
  restricted_city JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir referencia chat_id a la tabla cities
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES public.admin_chats(id);

-- Habilitar RLS
ALTER TABLE public.admin_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_finetuning_config ENABLE ROW LEVEL SECURITY;

-- Políticas para admin_chats
CREATE POLICY "Admins can manage their own chats" ON public.admin_chats
  FOR ALL USING (admin_user_id = auth.uid());

CREATE POLICY "Public can view public chats" ON public.admin_chats
  FOR SELECT USING (is_public = true AND is_active = true);

-- Políticas para admin_finetuning_config
CREATE POLICY "Admins can manage their own configs" ON public.admin_finetuning_config
  FOR ALL USING (admin_user_id = auth.uid());

-- Trigger para crear ciudad cuando se crea un chat de admin
CREATE OR REPLACE FUNCTION public.create_city_for_admin_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Crear ciudad para el admin si no existe
  IF NOT EXISTS (SELECT 1 FROM cities WHERE admin_user_id = NEW.admin_user_id) THEN
    INSERT INTO cities (name, slug, admin_user_id, chat_id)
    VALUES (
      generate_provisional_city_name(),
      generate_city_slug(),
      NEW.admin_user_id,
      NEW.id
    );
  ELSE
    -- Actualizar el chat_id en la ciudad existente
    UPDATE cities 
    SET chat_id = NEW.id, updated_at = NOW()
    WHERE admin_user_id = NEW.admin_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_city_on_admin_chat
  AFTER INSERT ON public.admin_chats
  FOR EACH ROW EXECUTE FUNCTION public.create_city_for_admin_chat();