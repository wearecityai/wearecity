-- Actualizar la política de ciudades para permitir acceso anónimo
DROP POLICY IF EXISTS "Cities are publicly readable" ON public.cities;

CREATE POLICY "Cities are publicly readable" ON public.cities
FOR SELECT USING (true);

-- Actualizar políticas de conversaciones para permitir acceso anónimo cuando user_id es NULL
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can view conversations" ON public.conversations
FOR SELECT USING (
  auth.uid() = user_id 
  OR user_id IS NULL 
  OR auth.uid() IS NULL
);

CREATE POLICY "Users can create conversations" ON public.conversations
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  OR user_id IS NULL 
  OR auth.uid() IS NULL
);

-- Actualizar políticas de mensajes para permitir acceso anónimo
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages from conversations" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (
      conversations.user_id = auth.uid() 
      OR conversations.user_id IS NULL 
      OR auth.uid() IS NULL
    )
  )
);

CREATE POLICY "Users can create messages in conversations" ON public.messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (
      conversations.user_id = auth.uid() 
      OR conversations.user_id IS NULL 
      OR auth.uid() IS NULL
    )
  )
);