-- Añadir columna chat_slug a assistant_config
ALTER TABLE assistant_config 
ADD COLUMN chat_slug TEXT UNIQUE,
ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Crear índice para búsquedas rápidas por slug
CREATE INDEX idx_assistant_config_chat_slug ON assistant_config(chat_slug);

-- Función para generar slug único
CREATE OR REPLACE FUNCTION generate_chat_slug()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Generar slug con timestamp + random
    new_slug := 'chat_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || 
                LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    
    -- Verificar si ya existe
    IF NOT EXISTS (SELECT 1 FROM assistant_config WHERE chat_slug = new_slug) THEN
      RETURN new_slug;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      RAISE EXCEPTION 'No se pudo generar un slug único después de 10 intentos';
    END IF;
  END LOOP;
END;
$$;

-- Función para obtener chat por slug
CREATE OR REPLACE FUNCTION get_chat_by_slug(chat_slug_param TEXT)
RETURNS TABLE (
  id UUID,
  config_name TEXT,
  assistant_name TEXT,
  system_instruction TEXT,
  chat_slug TEXT,
  is_public BOOLEAN,
  user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.config_name,
    ac.assistant_name,
    ac.system_instruction,
    ac.chat_slug,
    ac.is_public,
    ac.user_id,
    ac.created_at,
    ac.updated_at
  FROM assistant_config ac
  WHERE ac.chat_slug = chat_slug_param
  AND (ac.is_public = true OR ac.user_id = auth.uid())
  LIMIT 1;
END;
$$;

-- Función para crear chat público
CREATE OR REPLACE FUNCTION create_public_chat(
  config_name_param TEXT,
  assistant_name_param TEXT,
  system_instruction_param TEXT,
  is_public_param BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  chat_slug TEXT,
  is_public BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_chat_id UUID;
  new_slug TEXT;
BEGIN
  -- Generar slug único
  new_slug := generate_chat_slug();
  
  -- Crear configuración
  INSERT INTO assistant_config (
    config_name,
    assistant_name,
    system_instruction,
    chat_slug,
    is_public,
    user_id,
    is_active
  )
  VALUES (
    config_name_param,
    assistant_name_param,
    system_instruction_param,
    new_slug,
    is_public_param,
    auth.uid(),
    true
  )
  RETURNING id INTO new_chat_id;
  
  -- Devolver resultado
  RETURN QUERY
  SELECT 
    ac.id,
    ac.chat_slug,
    ac.is_public
  FROM assistant_config ac
  WHERE ac.id = new_chat_id;
END;
$$;

-- Función para actualizar chat slug
CREATE OR REPLACE FUNCTION update_chat_slug(
  chat_id UUID,
  new_slug TEXT,
  is_public_param BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario es dueño del chat
  IF NOT EXISTS (
    SELECT 1 FROM assistant_config 
    WHERE id = chat_id AND user_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;
  
  -- Verificar que el slug no esté en uso
  IF EXISTS (
    SELECT 1 FROM assistant_config 
    WHERE chat_slug = new_slug AND id != chat_id
  ) THEN
    RETURN false;
  END IF;
  
  -- Actualizar
  UPDATE assistant_config 
  SET 
    chat_slug = new_slug,
    is_public = is_public_param,
    updated_at = NOW()
  WHERE id = chat_id AND user_id = auth.uid();
  
  RETURN true;
END;
$$; 