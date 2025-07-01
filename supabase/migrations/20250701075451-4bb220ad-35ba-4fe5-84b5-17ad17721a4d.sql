
-- Habilitar RLS para la tabla assistant_config (si no está habilitado)
ALTER TABLE public.assistant_config ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para assistant_config (solo si no existen)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assistant_config' AND policyname = 'Users can view their own config') THEN
        CREATE POLICY "Users can view their own config" 
          ON public.assistant_config 
          FOR SELECT 
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assistant_config' AND policyname = 'Users can insert their own config') THEN
        CREATE POLICY "Users can insert their own config" 
          ON public.assistant_config 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assistant_config' AND policyname = 'Users can update their own config') THEN
        CREATE POLICY "Users can update their own config" 
          ON public.assistant_config 
          FOR UPDATE 
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Habilitar RLS para la tabla conversations (si no está habilitado)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para la tabla messages (si no está habilitado)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para messages (solo si no existen)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view messages from their conversations') THEN
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
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can insert messages to their conversations') THEN
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
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can update messages in their conversations') THEN
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
    END IF;
END $$;

-- Agregar índice único para user_id en assistant_config (solo si no existe)
CREATE UNIQUE INDEX IF NOT EXISTS assistant_config_user_id_unique_idx 
  ON public.assistant_config (user_id) 
  WHERE is_active = true;
