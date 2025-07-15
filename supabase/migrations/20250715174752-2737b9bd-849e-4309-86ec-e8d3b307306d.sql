-- Agregar los nuevos valores al enum existente
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'ciudadano';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'administrativo';

-- Actualizar la función handle_new_user para mapear correctamente los roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_value public.user_role;
BEGIN
  -- Mapear el rol del metadata al enum correcto
  CASE NEW.raw_user_meta_data ->> 'role'
    WHEN 'ciudadano' THEN user_role_value := 'ciudadano'::public.user_role;
    WHEN 'administrativo' THEN user_role_value := 'administrativo'::public.user_role;
    WHEN 'citizen' THEN user_role_value := 'ciudadano'::public.user_role;
    WHEN 'admin' THEN user_role_value := 'administrativo'::public.user_role;
    ELSE user_role_value := 'ciudadano'::public.user_role;
  END CASE;

  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    user_role_value
  );
  RETURN NEW;
END;
$$;

-- Asegurar que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();