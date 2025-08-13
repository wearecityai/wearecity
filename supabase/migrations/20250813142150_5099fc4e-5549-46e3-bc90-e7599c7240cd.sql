-- Add agenda_eventos_urls column to cities table
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS agenda_eventos_urls JSONB DEFAULT '[]'::jsonb;