-- Actualizar función para que nombre de ciudad, asistente y slug sean consistentes

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
  v_city_number INTEGER;
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
    -- Generar número secuencial para la ciudad
    SELECT COALESCE(MAX(CAST(SUBSTRING(name FROM 'Nuevaciudad-(\d+)') AS INTEGER)), 0) + 1
    INTO v_city_number
    FROM cities
    WHERE name LIKE 'Nuevaciudad-%';
    
    -- Generar nombre consistente
    v_city_name := 'Nuevaciudad-' || v_city_number;
    
    -- Generar slug basado en el nombre (consistente)
    v_city_slug := 'nuevaciudad-' || v_city_number;
    
    -- Verificar que el slug sea único (por si acaso)
    WHILE EXISTS (SELECT 1 FROM cities WHERE slug = v_city_slug) LOOP
      v_city_number := v_city_number + 1;
      v_city_name := 'Nuevaciudad-' || v_city_number;
      v_city_slug := 'nuevaciudad-' || v_city_number;
    END LOOP;
    
    -- Crear la ciudad con nombres consistentes
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
      v_city_name,                    -- Nombre: "Nuevaciudad-1"
      v_city_slug,                    -- Slug: "nuevaciudad-1"
      NEW.id,
      v_city_name,                    -- Asistente: "Nuevaciudad-1" (igual que la ciudad)
      'Soy ' || v_city_name || ', el asistente virtual de nuestra ciudad. Estoy aquí para ayudar a los ciudadanos con información sobre trámites, servicios municipales y todo lo relacionado con la vida en nuestra ciudad.',
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
    
    RAISE NOTICE 'Ciudad creada automáticamente: Nombre=%, Slug=%, Asistente=% para admin %', v_city_name, v_city_slug, v_city_name, NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no fallar la creación del usuario
    RAISE NOTICE 'Error en handle_new_user para usuario %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;