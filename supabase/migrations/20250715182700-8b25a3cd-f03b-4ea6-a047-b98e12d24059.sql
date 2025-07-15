-- Eliminar el trigger duplicado que está causando la creación de 2 ciudades
-- Solo mantenemos el trigger 'on_admin_profile_created'
DROP TRIGGER IF EXISTS trg_create_city_on_admin_profile ON public.profiles;