-- Verificar y mejorar el sistema de creación automática de ciudades para admins

-- Función para generar nombre provisional de ciudad
CREATE OR REPLACE FUNCTION public.generate_provisional_city_name()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  city_number INTEGER;
  provisional_name TEXT;
BEGIN
  -- Obtener el siguiente número de ciudad
  SELECT COALESCE(MAX(CAST(SUBSTRING(name FROM 'Nuevaciudad-(\d+)') AS INTEGER)), 0) + 1
  INTO city_number
  FROM cities
  WHERE name LIKE 'Nuevaciudad-%';
  
  provisional_name := 'Nuevaciudad-' || city_number;
  RETURN provisional_name;
END;
$$;

-- Función para generar slug único de ciudad
CREATE OR REPLACE FUNCTION public.generate_city_slug()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Generar slug con timestamp + random
    new_slug := 'ciudad_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || 
                LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    
    -- Verificar si ya existe
    IF NOT EXISTS (SELECT 1 FROM cities WHERE slug = new_slug) THEN
      RETURN new_slug;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      RAISE EXCEPTION 'No se pudo generar un slug único después de 10 intentos';
    END IF;
  END LOOP;
END;
$$;

-- Función principal para crear ciudad para admin
CREATE OR REPLACE FUNCTION public.create_city_for_admin(admin_user_id_param uuid)
RETURNS TABLE(id uuid, name text, slug text, admin_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_city_id UUID;
  provisional_name TEXT;
  new_slug TEXT;
BEGIN
  -- Verificar que el usuario es admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = admin_user_id_param 
    AND profiles.role = 'administrativo'
  ) THEN
    RAISE EXCEPTION 'Solo los administradores pueden tener ciudades';
  END IF;

  -- Verificar que el admin no tenga ya una ciudad
  IF EXISTS (SELECT 1 FROM cities WHERE admin_user_id = admin_user_id_param AND is_active = true) THEN
    RAISE NOTICE 'El administrador ya tiene una ciudad asignada';
    -- Devolver la ciudad existente
    RETURN QUERY
    SELECT 
      c.id,
      c.name,
      c.slug,
      c.admin_user_id
    FROM cities c
    WHERE c.admin_user_id = admin_user_id_param AND c.is_active = true
    LIMIT 1;
    RETURN;
  END IF;

  -- Generar nombre provisional y slug único
  provisional_name := generate_provisional_city_name();
  new_slug := generate_city_slug();

  -- Crear la ciudad
  INSERT INTO cities (
    name,
    slug,
    admin_user_id,
    assistant_name,
    system_instruction,
    enable_google_search,
    allow_map_display,
    allow_geolocation,
    current_language_code,
    is_active
  )
  VALUES (
    provisional_name,
    new_slug,
    admin_user_id_param,
    'Asistente de ' || provisional_name,
    'Soy el asistente virtual de ' || provisional_name || '. Estoy aquí para ayudar a los ciudadanos con información sobre nuestra ciudad.',
    true,
    true,
    true,
    'es',
    true
  )
  RETURNING id INTO new_city_id;

  -- Devolver resultado
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.admin_user_id
  FROM cities c
  WHERE c.id = new_city_id;
END;
$$;