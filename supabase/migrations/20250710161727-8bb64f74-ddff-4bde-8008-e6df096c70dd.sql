-- Recrear completamente el sistema de creación automática de ciudades

-- Primero, eliminar trigger si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Función para crear perfil y ciudad automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_meta JSONB;
  v_role TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_city_name TEXT;
  v_city_slug TEXT;
  v_city_id UUID;
BEGIN
  -- Detectar metadatos del usuario
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_meta := NEW.raw_user_meta_data;
  ELSIF NEW.user_metadata IS NOT NULL THEN
    v_meta := NEW.user_metadata;
  ELSE
    v_meta := '{}'::jsonb;
  END IF;

  -- Extraer datos
  v_role := COALESCE(v_meta->>'role', 'ciudadano');
  v_first_name := COALESCE(v_meta->>'first_name', '');
  v_last_name := COALESCE(v_meta->>'last_name', '');

  -- Crear perfil del usuario
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_role::public.user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Si es admin, crear ciudad automáticamente
  IF v_role = 'administrativo' THEN
    -- Generar nombre provisional de ciudad
    SELECT COALESCE(MAX(CAST(SUBSTRING(name FROM 'Nuevaciudad-(\d+)') AS INTEGER)), 0) + 1
    INTO v_city_name
    FROM cities
    WHERE name LIKE 'Nuevaciudad-%';
    
    v_city_name := 'Nuevaciudad-' || v_city_name;
    
    -- Generar slug único
    v_city_slug := 'ciudad_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || 
                   LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    
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
      recommended_prompts,
      service_tags,
      procedure_source_urls,
      uploaded_procedure_documents,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      v_city_name,
      v_city_slug,
      NEW.id,
      'Asistente de ' || v_city_name,
      'Soy el asistente virtual de ' || v_city_name || '. Estoy aquí para ayudar a los ciudadanos con información sobre nuestra ciudad, trámites, servicios municipales y todo lo relacionado con la vida en nuestra ciudad.',
      true,
      true,
      true,
      'es',
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_city_id;
    
    RAISE NOTICE 'Ciudad creada automáticamente: % con slug % para admin %', v_city_name, v_city_slug, NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no fallar la creación del usuario
    RAISE NOTICE 'Error en handle_new_user para usuario %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verificar que el trigger se creó correctamente
SELECT trigger_name, event_manipulation, trigger_schema, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';