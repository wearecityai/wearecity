-- Fix user_role enum values to match application code
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('ciudadano', 'administrativo');

-- Update profiles table to use corrected enum
ALTER TABLE public.profiles ALTER COLUMN role TYPE public.user_role USING role::text::public.user_role;

-- Add missing columns to cities table
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS assistant_name TEXT DEFAULT 'Asistente Municipal',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Enable RLS on all tables
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for cities table
CREATE POLICY "Cities are publicly viewable" 
ON public.cities 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Admins can view their own city" 
ON public.cities 
FOR SELECT 
USING (auth.uid() = admin_user_id);

CREATE POLICY "Admins can update their own city" 
ON public.cities 
FOR UPDATE 
USING (auth.uid() = admin_user_id);

-- Create policies for conversations table  
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for messages table
CREATE POLICY "Users can view messages from their conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in their conversations" 
ON public.messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

-- Create function to automatically create cities for admin users
CREATE OR REPLACE FUNCTION public.create_provisional_city_for_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  provisional_name TEXT;
  provisional_slug TEXT;
BEGIN
  -- Only create city for admin role
  IF NEW.role = 'administrativo' THEN
    provisional_name := 'Ciudad provisional de ' || COALESCE(NEW.first_name, 'Admin');
    
    -- Generate unique slug
    LOOP
      provisional_slug := 'provisional-' || encode(gen_random_bytes(4), 'hex');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = provisional_slug);
    END LOOP;
    
    -- Insert the provisional city
    INSERT INTO public.cities (name, slug, admin_user_id, assistant_name)
    VALUES (provisional_name, provisional_slug, NEW.id, 'Asistente de ' || provisional_name);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create cities for admin users
CREATE TRIGGER on_admin_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_provisional_city_for_admin();