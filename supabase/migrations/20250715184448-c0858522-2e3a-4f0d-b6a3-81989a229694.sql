-- Eliminar tablas innecesarias - toda la configuración va en cities
DROP TABLE IF EXISTS public.admin_finetuning_config CASCADE;
DROP TABLE IF EXISTS public.admin_chats CASCADE;

-- Eliminar funciones relacionadas con admin_chats
DROP FUNCTION IF EXISTS public.create_city_for_admin_chat() CASCADE;
DROP FUNCTION IF EXISTS public.create_admin_chat(text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.generate_admin_chat_slug() CASCADE;

-- Eliminar la columna chat_id de cities ya que no la necesitamos
ALTER TABLE public.cities DROP COLUMN IF EXISTS chat_id;

-- Asegurar que la tabla cities tiene todos los campos necesarios para la configuración
-- (estos ya deberían existir de migraciones anteriores, pero por si acaso)
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS assistant_name TEXT DEFAULT 'Asistente Municipal';
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS system_instruction TEXT DEFAULT 'Eres un asistente inteligente que ayuda a los ciudadanos con información sobre la ciudad.';
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS recommended_prompts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS service_tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS enable_google_search BOOLEAN DEFAULT true;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS allow_map_display BOOLEAN DEFAULT true;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS allow_geolocation BOOLEAN DEFAULT true;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS current_language_code TEXT DEFAULT 'es';
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS procedure_source_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS uploaded_procedure_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS restricted_city JSONB;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS sede_electronica_url TEXT;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;