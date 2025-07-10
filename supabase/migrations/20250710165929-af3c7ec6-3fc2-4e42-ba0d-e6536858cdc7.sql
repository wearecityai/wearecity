-- Arreglar la función create_admin_chat para resolver la ambigüedad de columna 'id'
CREATE OR REPLACE FUNCTION public.create_admin_chat(chat_name_param text DEFAULT 'Mi Chat'::text, is_public_param boolean DEFAULT false)
 RETURNS TABLE(id uuid, chat_slug text, chat_name text, is_public boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_chat_id UUID;
  new_slug TEXT;
  current_user_id UUID;
BEGIN
  -- Verificar que el usuario es admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'administrativo'
  ) THEN
    RAISE EXCEPTION 'Solo los administradores pueden crear chats privados';
  END IF;
  
  current_user_id := auth.uid();
  
  -- Generar slug único
  new_slug := generate_admin_chat_slug();
  
  -- Crear chat
  INSERT INTO admin_chats (
    admin_user_id,
    chat_slug,
    chat_name,
    is_public
  )
  VALUES (
    current_user_id,
    new_slug,
    chat_name_param,
    is_public_param
  )
  RETURNING admin_chats.id INTO new_chat_id;
  
  -- Crear configuración de finetuning por defecto
  INSERT INTO admin_finetuning_config (
    admin_user_id,
    chat_id,
    config_name,
    assistant_name,
    system_instruction
  )
  VALUES (
    current_user_id,
    new_chat_id,
    'Configuración Principal',
    'Asistente de Ciudad',
    'Eres un asistente inteligente que ayuda a los ciudadanos con información sobre la ciudad.'
  );
  
  -- Devolver resultado
  RETURN QUERY
  SELECT 
    ac.id,
    ac.chat_slug,
    ac.chat_name,
    ac.is_public
  FROM admin_chats ac
  WHERE ac.id = new_chat_id;
END;
$function$