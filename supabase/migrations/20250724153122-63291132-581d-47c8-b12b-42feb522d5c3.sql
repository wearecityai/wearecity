-- Enable RLS on all remaining public tables that don't have it
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for events table (public read access)
CREATE POLICY "Events are publicly readable" ON public.events
FOR SELECT USING (true);

-- Create policies for places table (public read access)
CREATE POLICY "Places are publicly readable" ON public.places
FOR SELECT USING (true);

-- Create policies for city_links table (public read access)
CREATE POLICY "City links are publicly readable" ON public.city_links
FOR SELECT USING (true);

-- Create policies for user_conversations table (user-specific access)
CREATE POLICY "Users can view their own conversations" ON public.user_conversations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON public.user_conversations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.user_conversations
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.user_conversations
FOR DELETE USING (auth.uid() = user_id);