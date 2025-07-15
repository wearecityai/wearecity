-- Actualizar la función para crear ciudades automáticamente con configuración predeterminada
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
    
    -- Generar slug único basado en el nombre
    provisional_slug := lower(replace(replace(replace(provisional_name, ' ', '-'), 'á', 'a'), 'é', 'e'));
    provisional_slug := provisional_slug || '-' || encode(gen_random_bytes(2), 'hex');
    
    -- Asegurar que el slug sea único
    WHILE EXISTS (SELECT 1 FROM public.cities WHERE slug = provisional_slug) LOOP
      provisional_slug := lower(replace(replace(replace(provisional_name, ' ', '-'), 'á', 'a'), 'é', 'e')) || '-' || encode(gen_random_bytes(3), 'hex');
    END LOOP;
    
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

-- Crear función para actualizar slug automáticamente cuando cambie el nombre
CREATE OR REPLACE FUNCTION public.update_city_slug_on_name_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_slug TEXT;
BEGIN
  -- Solo actualizar si el nombre cambió
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    -- Generar nuevo slug basado en el nuevo nombre
    new_slug := lower(replace(replace(replace(NEW.name, ' ', '-'), 'á', 'a'), 'é', 'e'));
    new_slug := new_slug || '-' || encode(gen_random_bytes(2), 'hex');
    
    -- Asegurar que el nuevo slug sea único
    WHILE EXISTS (SELECT 1 FROM public.cities WHERE slug = new_slug AND id != NEW.id) LOOP
      new_slug := lower(replace(replace(replace(NEW.name, ' ', '-'), 'á', 'a'), 'é', 'e')) || '-' || encode(gen_random_bytes(3), 'hex');
    END LOOP;
    
    NEW.slug := new_slug;
    NEW.updated_at := now();
    
    RAISE LOG 'Slug actualizado para ciudad %: %', NEW.name, new_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recrear el trigger para creación automática de ciudades
DROP TRIGGER IF EXISTS on_admin_profile_created ON public.profiles;
CREATE TRIGGER on_admin_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_provisional_city_for_admin();

-- Crear trigger para actualizar slug cuando cambie el nombre
DROP TRIGGER IF EXISTS on_city_name_change ON public.cities;
CREATE TRIGGER on_city_name_change
  BEFORE UPDATE ON public.cities
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_city_slug_on_name_change();