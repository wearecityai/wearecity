
-- Fix the role constraint to allow both 'user' and 'model' values
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_role_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_role_check CHECK (role IN ('user', 'model'));

-- Remove duplicate RLS policies (keep the more specific ones)
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;

-- Ensure we have the correct RLS policies
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;

-- Recreate the RLS policies with correct names
CREATE POLICY "Users can insert messages to their conversations" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations" 
  ON public.messages 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view messages from their conversations" 
  ON public.messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );
