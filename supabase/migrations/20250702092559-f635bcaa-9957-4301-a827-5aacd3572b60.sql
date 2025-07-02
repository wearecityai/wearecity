
-- Crear tabla para sitios web scrapeados
CREATE TABLE public.scraped_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scraping_frequency_hours INTEGER DEFAULT 24,
  max_pages INTEGER DEFAULT 100,
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, base_url)
);

-- Crear tabla para páginas scrapeadas
CREATE TABLE public.scraped_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES public.scraped_websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  content_hash TEXT,
  page_type TEXT DEFAULT 'html',
  status_code INTEGER,
  last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(website_id, url)
);

-- Crear tabla para documentos extraídos
CREATE TABLE public.scraped_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.scraped_pages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  download_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índices para búsqueda de texto completo
CREATE INDEX idx_scraped_pages_content_gin ON public.scraped_pages USING gin(to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(content, '')));
CREATE INDEX idx_scraped_documents_text_gin ON public.scraped_documents USING gin(to_tsvector('spanish', coalesce(extracted_text, '')));

-- Crear índices adicionales para performance
CREATE INDEX idx_scraped_websites_user_id ON public.scraped_websites(user_id);
CREATE INDEX idx_scraped_pages_website_id ON public.scraped_pages(website_id);
CREATE INDEX idx_scraped_documents_page_id ON public.scraped_documents(page_id);
CREATE INDEX idx_scraped_pages_last_scraped ON public.scraped_pages(last_scraped_at);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.scraped_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para scraped_websites
CREATE POLICY "Users can view their own scraped websites" 
  ON public.scraped_websites 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scraped websites" 
  ON public.scraped_websites 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraped websites" 
  ON public.scraped_websites 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scraped websites" 
  ON public.scraped_websites 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para scraped_pages
CREATE POLICY "Users can view pages from their websites" 
  ON public.scraped_pages 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.scraped_websites 
    WHERE id = scraped_pages.website_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert pages for their websites" 
  ON public.scraped_pages 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.scraped_websites 
    WHERE id = scraped_pages.website_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update pages from their websites" 
  ON public.scraped_pages 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.scraped_websites 
    WHERE id = scraped_pages.website_id AND user_id = auth.uid()
  ));

-- Políticas RLS para scraped_documents
CREATE POLICY "Users can view documents from their pages" 
  ON public.scraped_documents 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.scraped_pages sp
    JOIN public.scraped_websites sw ON sp.website_id = sw.id
    WHERE sp.id = scraped_documents.page_id AND sw.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert documents for their pages" 
  ON public.scraped_documents 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.scraped_pages sp
    JOIN public.scraped_websites sw ON sp.website_id = sw.id
    WHERE sp.id = scraped_documents.page_id AND sw.user_id = auth.uid()
  ));

CREATE POLICY "Users can update documents from their pages" 
  ON public.scraped_documents 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.scraped_pages sp
    JOIN public.scraped_websites sw ON sp.website_id = sw.id
    WHERE sp.id = scraped_documents.page_id AND sw.user_id = auth.uid()
  ));

-- Función para buscar en contenido scrapeado
CREATE OR REPLACE FUNCTION public.search_scraped_content(
  search_query TEXT,
  user_id_param UUID,
  limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  url TEXT,
  website_name TEXT,
  content_type TEXT,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.title,
    sp.content,
    sp.url,
    sw.name as website_name,
    'page'::TEXT as content_type,
    ts_rank(to_tsvector('spanish', coalesce(sp.title, '') || ' ' || coalesce(sp.content, '')), plainto_tsquery('spanish', search_query)) as rank
  FROM public.scraped_pages sp
  JOIN public.scraped_websites sw ON sp.website_id = sw.id
  WHERE sw.user_id = user_id_param
    AND sw.is_active = true
    AND to_tsvector('spanish', coalesce(sp.title, '') || ' ' || coalesce(sp.content, '')) @@ plainto_tsquery('spanish', search_query)
  
  UNION ALL
  
  SELECT 
    sd.id,
    sd.filename as title,
    sd.extracted_text as content,
    sd.file_url as url,
    sw.name as website_name,
    'document'::TEXT as content_type,
    ts_rank(to_tsvector('spanish', coalesce(sd.extracted_text, '')), plainto_tsquery('spanish', search_query)) as rank
  FROM public.scraped_documents sd
  JOIN public.scraped_pages sp ON sd.page_id = sp.id
  JOIN public.scraped_websites sw ON sp.website_id = sw.id
  WHERE sw.user_id = user_id_param
    AND sw.is_active = true
    AND sd.extracted_text IS NOT NULL
    AND to_tsvector('spanish', coalesce(sd.extracted_text, '')) @@ plainto_tsquery('spanish', search_query)
  
  ORDER BY rank DESC
  LIMIT limit_param;
END;
$$;
