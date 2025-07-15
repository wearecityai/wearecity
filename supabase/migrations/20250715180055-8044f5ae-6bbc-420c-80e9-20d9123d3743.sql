-- Agregar las columnas faltantes a la tabla cities
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS assistant_name TEXT DEFAULT 'Asistente Municipal',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Verificar que los triggers existen correctamente
-- Primero verificar si el trigger handle_new_user existe y está funcionando
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_value public.user_role;
BEGIN
  -- Log para debug
  RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
  RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
  
  -- Mapear el rol del metadata al enum correcto
  CASE NEW.raw_user_meta_data ->> 'role'
    WHEN 'ciudadano' THEN user_role_value := 'ciudadano'::public.user_role;
    WHEN 'administrativo' THEN user_role_value := 'administrativo'::public.user_role;
    WHEN 'citizen' THEN user_role_value := 'ciudadano'::public.user_role;
    WHEN 'admin' THEN user_role_value := 'administrativo'::public.user_role;
    ELSE user_role_value := 'ciudadano'::public.user_role;
  END CASE;

  -- Log del rol que se va a insertar
  RAISE LOG 'Inserting profile with role: %', user_role_value;

  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    user_role_value
  );
  
  RAISE LOG 'Profile created successfully for user: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$;

-- Asegurar que el trigger está activo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();