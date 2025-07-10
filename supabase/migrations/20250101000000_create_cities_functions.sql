-- Función para obtener todas las ciudades
CREATE OR REPLACE FUNCTION get_cities()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  admin_user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.admin_user_id,
    c.created_at,
    c.updated_at
  FROM cities c
  ORDER BY c.name ASC;
END;
$$;

-- Función para obtener una ciudad por slug
CREATE OR REPLACE FUNCTION get_city_by_slug(city_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  admin_user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.admin_user_id,
    c.created_at,
    c.updated_at
  FROM cities c
  WHERE c.slug = city_slug
  LIMIT 1;
END;
$$;

-- Función para obtener la ciudad de un usuario (si es admin)
CREATE OR REPLACE FUNCTION get_user_city(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  admin_user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.admin_user_id,
    c.created_at,
    c.updated_at
  FROM cities c
  WHERE c.admin_user_id = user_id
  LIMIT 1;
END;
$$;

-- Función para crear una nueva ciudad
CREATE OR REPLACE FUNCTION create_city(
  city_name TEXT,
  city_slug TEXT,
  admin_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  admin_user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_city_id UUID;
BEGIN
  -- Verificar que el usuario no tenga ya una ciudad
  IF EXISTS (SELECT 1 FROM cities WHERE admin_user_id = admin_id) THEN
    RAISE EXCEPTION 'El usuario ya tiene una ciudad asignada';
  END IF;
  
  -- Verificar que el slug no esté en uso
  IF EXISTS (SELECT 1 FROM cities WHERE slug = city_slug) THEN
    RAISE EXCEPTION 'El slug ya está en uso';
  END IF;
  
  -- Crear la nueva ciudad
  INSERT INTO cities (name, slug, admin_user_id)
  VALUES (city_name, city_slug, admin_id)
  RETURNING cities.id INTO new_city_id;
  
  -- Devolver la ciudad creada
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.admin_user_id,
    c.created_at,
    c.updated_at
  FROM cities c
  WHERE c.id = new_city_id;
END;
$$;

-- Función para verificar si un slug está disponible
CREATE OR REPLACE FUNCTION is_slug_available(city_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM cities WHERE slug = city_slug);
END;
$$; 