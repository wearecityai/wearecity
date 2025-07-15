-- Verificar y corregir el tipo user_role y la función handle_new_user
-- Primero, asegurar que el tipo existe con los valores correctos
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('ciudadano', 'administrativo');

-- Recrear la tabla profiles con el tipo correcto
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE public.user_role USING 
  CASE 
    WHEN role::text = 'citizen' THEN 'ciudadano'::user_role
    WHEN role::text = 'admin' THEN 'administrativo'::user_role
    ELSE 'ciudadano'::user_role
  END;

-- Corregir la función handle_new_user para usar los valores correctos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'ciudadano'::public.user_role)
  );
  RETURN NEW;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();