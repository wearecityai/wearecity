-- Función para generar slug único y provisional
CREATE OR REPLACE FUNCTION public.generate_city_slug()
RETURNS TEXT AS $$
DECLARE
  new_slug TEXT;
BEGIN
  LOOP
    new_slug := 'provisional-' || encode(gen_random_bytes(4), 'hex');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = new_slug);
  END LOOP;
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: al crear un perfil admin, crear ciudad provisional
CREATE OR REPLACE FUNCTION public.create_provisional_city_for_admin()
RETURNS TRIGGER AS $$
DECLARE
  provisional_name TEXT;
  provisional_slug TEXT;
BEGIN
  IF NEW.role = 'admin' THEN
    provisional_name := 'Ciudad provisional de ' || COALESCE(NEW.first_name, 'Admin');
    provisional_slug := public.generate_city_slug();
    INSERT INTO public.cities (name, slug, admin_user_id)
    VALUES (provisional_name, provisional_slug, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en la tabla profiles
DROP TRIGGER IF EXISTS trg_create_city_on_admin_profile ON public.profiles;
CREATE TRIGGER trg_create_city_on_admin_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_provisional_city_for_admin(); 