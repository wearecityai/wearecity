-- Enable RLS on all existing public tables that don't have it enabled
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for cities table (public read access since it's a city chat app)
CREATE POLICY "Cities are publicly readable" ON public.cities
FOR SELECT USING (true);

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Create policies for conversations table
CREATE POLICY "Users can view their own conversations" ON public.conversations
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create conversations" ON public.conversations
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own conversations" ON public.conversations
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policies for messages table (allow access to messages in conversations the user owns or anonymous ones)
CREATE POLICY "Users can view messages from their conversations" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.user_id = auth.uid() OR conversations.user_id IS NULL)
  )
);

CREATE POLICY "Users can create messages in their conversations" ON public.messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.user_id = auth.uid() OR conversations.user_id IS NULL)
  )
);

CREATE POLICY "Users can update messages in their conversations" ON public.messages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.user_id = auth.uid() OR conversations.user_id IS NULL)
  )
);

CREATE POLICY "Users can delete messages in their conversations" ON public.messages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.user_id = auth.uid() OR conversations.user_id IS NULL)
  )
);