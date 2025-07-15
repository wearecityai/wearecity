-- Habilitar la extensión pgcrypto que contiene gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear función alternativa para generar slugs únicos sin gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  slug_candidate TEXT;
  counter INTEGER := 1;
BEGIN
  -- Crear slug base limpiando el nombre
  slug_candidate := lower(
    replace(
      replace(
        replace(
          replace(
            replace(base_name, ' ', '-'), 
            'á', 'a'
          ), 
          'é', 'e'
        ), 
        'í', 'i'
      ), 
      'ó', 'o'
    )
  );
  
  -- Si el slug base no existe, usarlo
  IF NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = slug_candidate) THEN
    RETURN slug_candidate;
  END IF;
  
  -- Si existe, agregar números incrementales
  LOOP
    slug_candidate := lower(
      replace(
        replace(
          replace(
            replace(
              replace(base_name, ' ', '-'), 
              'á', 'a'
            ), 
            'é', 'e'
          ), 
          'í', 'i'
        ), 
        'ó', 'o'
      )
    ) || '-' || counter::text;
    
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = slug_candidate);
    counter := counter + 1;
  END LOOP;
  
  RETURN slug_candidate;
END;
$$;

-- Actualizar función para crear ciudades automáticamente usando la nueva función de slug
CREATE OR REPLACE FUNCTION public.create_provisional_city_for_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  provisional_name TEXT;
  provisional_slug TEXT;
BEGIN
  -- Solo crear ciudad para rol administrativo
  IF NEW.role = 'administrativo' THEN
    provisional_name := 'Ciudad de ' || COALESCE(NEW.first_name, 'Admin');
    
    -- Generar slug único usando la nueva función
    provisional_slug := public.generate_unique_slug(provisional_name);
    
    -- Insertar la ciudad provisional con configuración predeterminada
    INSERT INTO public.cities (
      name, 
      slug, 
      admin_user_id, 
      assistant_name,
      is_public,
      is_active
    )
    VALUES (
      provisional_name, 
      provisional_slug, 
      NEW.id, 
      'Asistente de ' || provisional_name,
      true,
      true
    );
    
    RAISE LOG 'Ciudad creada automáticamente: % con slug: %', provisional_name, provisional_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Actualizar función para actualizar slug cuando cambie el nombre
CREATE OR REPLACE FUNCTION public.update_city_slug_on_name_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo actualizar si el nombre cambió
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    -- Generar nuevo slug usando la función segura
    NEW.slug := public.generate_unique_slug(NEW.name);
    NEW.updated_at := now();
    
    RAISE LOG 'Slug actualizado para ciudad %: %', NEW.name, NEW.slug;
  END IF;
  
  RETURN NEW;
END;
$$;