-- Actualizar la función handle_new_user para que NO cree ciudades
-- Solo debe crear el perfil, la creación de ciudades se maneja en el trigger de profiles
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
  -- Nota: NO creamos ciudad aquí, eso se maneja en el trigger de profiles
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$;