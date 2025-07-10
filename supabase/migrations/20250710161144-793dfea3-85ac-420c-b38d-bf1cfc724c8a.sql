-- Recrear la función handle_new_user con manejo robusto de errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_meta JSONB;
  v_role TEXT;
BEGIN
  -- Detectar el campo correcto de metadatos
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_meta := NEW.raw_user_meta_data;
  ELSIF NEW.user_metadata IS NOT NULL THEN
    v_meta := NEW.user_metadata;
  ELSE
    v_meta := '{}'::jsonb;
  END IF;

  v_role := COALESCE(v_meta->>'role', 'ciudadano');

  -- Crear perfil siempre, con valores por defecto si faltan datos
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
    COALESCE(v_meta->>'first_name', ''),
    COALESCE(v_meta->>'last_name', ''),
    v_role::public.user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Solo crear ciudad si el rol es exactamente 'administrativo'
  IF v_role = 'administrativo' THEN
    BEGIN
      PERFORM create_city_for_admin(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo crear ciudad para admin %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();