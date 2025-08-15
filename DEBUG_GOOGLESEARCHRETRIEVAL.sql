-- Script para debug y configuración de Google Search Retrieval

-- 1. Verificar configuración actual de La Vila Joiosa
SELECT 
    id,
    name,
    slug,
    agenda_eventos_urls,
    json_array_length(agenda_eventos_urls) as num_urls
FROM cities 
WHERE slug ILIKE '%vila%' OR slug ILIKE '%joiosa%' OR name ILIKE '%vila%' OR name ILIKE '%joiosa%';

-- 2. Verificar todas las ciudades con agenda_eventos_urls configuradas
SELECT 
    id,
    name,
    slug,
    agenda_eventos_urls,
    json_array_length(agenda_eventos_urls) as num_urls
FROM cities 
WHERE agenda_eventos_urls IS NOT NULL 
  AND agenda_eventos_urls != '[]'
  AND json_array_length(agenda_eventos_urls) > 0;

-- 3. Si La Vila Joiosa no tiene URLs configuradas, añadirlas
-- (Solo ejecutar si es necesario después de verificar)
UPDATE cities 
SET agenda_eventos_urls = '[
  "https://www.villajoyosa.com/agenda-municipal/",
  "https://www.turismolavilajoiosa.com/es/Agenda",
  "https://villajoyosa.es/eventos/",
  "https://cultura.villajoyosa.com/programacion/"
]'
WHERE (slug ILIKE '%vila%' OR slug ILIKE '%joiosa%' OR name ILIKE '%vila%' OR name ILIKE '%joiosa%')
  AND (agenda_eventos_urls IS NULL OR agenda_eventos_urls = '[]' OR json_array_length(agenda_eventos_urls) = 0);

-- 4. Verificar que la configuración se aplicó correctamente
SELECT 
    id,
    name,
    slug,
    agenda_eventos_urls,
    json_array_length(agenda_eventos_urls) as num_urls
FROM cities 
WHERE slug ILIKE '%vila%' OR slug ILIKE '%joiosa%' OR name ILIKE '%vila%' OR name ILIKE '%joiosa%';

-- 5. Verificar también la tabla assistant_config (por si se usa esa)
SELECT 
    id,
    user_id,
    agenda_eventos_urls,
    CASE 
        WHEN agenda_eventos_urls IS NOT NULL 
        THEN json_array_length(agenda_eventos_urls) 
        ELSE 0 
    END as num_urls
FROM assistant_config 
WHERE is_active = true 
  AND agenda_eventos_urls IS NOT NULL 
  AND agenda_eventos_urls != '[]';

-- URLs recomendadas para La Vila Joiosa:
-- "https://www.villajoyosa.com/agenda-municipal/"
-- "https://www.turismolavilajoiosa.com/es/Agenda" 
-- "https://villajoyosa.es/eventos/"
-- "https://cultura.villajoyosa.com/programacion/"

-- URLs alternativas si las principales no funcionan:
-- "https://www.villajoyosa.com/"
-- "https://www.turismolavilajoiosa.com/"
-- "https://villajoyosa.es/"
