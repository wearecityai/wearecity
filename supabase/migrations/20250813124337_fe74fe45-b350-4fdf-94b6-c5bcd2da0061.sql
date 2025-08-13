-- Fix critical security vulnerability in conversations and messages RLS policies
-- Remove access for anonymous users to view all data, only allow access to their own anonymous conversations

-- Drop existing problematic policies for conversations
DROP POLICY IF EXISTS "Users can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

-- Create secure policies for conversations
-- Authenticated users can only see their own conversations
-- Anonymous users can only see conversations where user_id IS NULL (their own anonymous conversations)
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users can create their own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Drop existing problematic policies for messages
DROP POLICY IF EXISTS "Users can view messages from conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.messages;

-- Create secure policies for messages
-- Only allow access to messages in conversations the user owns
CREATE POLICY "Users can view messages in their own conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (
      (conversations.user_id = auth.uid()) OR 
      (auth.uid() IS NULL AND conversations.user_id IS NULL)
    )
  )
);

CREATE POLICY "Users can create messages in their own conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (
      (conversations.user_id = auth.uid()) OR 
      (auth.uid() IS NULL AND conversations.user_id IS NULL)
    )
  )
);

CREATE POLICY "Users can update messages in their own conversations" 
ON public.messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (
      (conversations.user_id = auth.uid()) OR 
      (auth.uid() IS NULL AND conversations.user_id IS NULL)
    )
  )
);

CREATE POLICY "Users can delete messages in their own conversations" 
ON public.messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (
      (conversations.user_id = auth.uid()) OR 
      (auth.uid() IS NULL AND conversations.user_id IS NULL)
    )
  )
);