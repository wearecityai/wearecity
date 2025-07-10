-- Fix missing function and clean up auth setup
-- Create the missing generate_unique_slug function
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
  final_slug TEXT;
BEGIN
  -- Create base slug from email (part before @)
  slug := lower(trim(split_part(base_text, '@', 1)));
  -- Replace any non-alphanumeric characters with hyphens
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  -- Remove leading/trailing hyphens
  slug := trim(slug, '-');
  
  -- Ensure slug is not empty
  IF slug = '' THEN
    slug := 'user';
  END IF;
  
  final_slug := slug;
  
  -- Check if slug exists and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.cities WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Recreate the handle_new_user function to fix any issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role_value public.user_role;
  generated_slug TEXT;
  city_name TEXT;
BEGIN
  -- Get user role from metadata
  user_role_value := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'ciudadano');
  
  -- Create user profile
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    user_role_value
  );
  
  -- If admin user, create their city/chat automatically
  IF user_role_value = 'administrativo' THEN
    -- Generate unique slug
    generated_slug := generate_unique_slug(NEW.email);
    
    -- Create temporary city name (admin can change it later)
    city_name := 'Chat de ' || COALESCE(NEW.raw_user_meta_data ->> 'first_name', split_part(NEW.email, '@', 1));
    
    -- Create the city
    INSERT INTO public.cities (id, name, slug, admin_user_id)
    VALUES (gen_random_uuid(), city_name, generated_slug, NEW.id);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;