-- Crear tabla conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  city_slug TEXT REFERENCES cities(slug) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_city_slug ON conversations(city_slug);

-- Comentarios para documentación
COMMENT ON COLUMN conversations.city_slug IS 'Slug of the city this conversation belongs to. NULL for general conversations.';
COMMENT ON COLUMN conversations.user_id IS 'User who owns the conversation'; 