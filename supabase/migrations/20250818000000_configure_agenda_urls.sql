-- Configurar URLs de agenda para ciudades
-- Esta migración activa la funcionalidad de eventos en la Edge Function

-- Configurar URLs de agenda para La Vila Joiosa
UPDATE cities 
SET agenda_eventos_urls = '[
  "https://www.villajoyosa.com/agenda-municipal/",
  "https://www.turismolavilajoiosa.com/es/Agenda",
  "https://villajoyosa.es/eventos/",
  "https://cultura.villajoyosa.com/programacion/"
]'
WHERE (name ILIKE '%vila joiosa%' OR name ILIKE '%villajoyosa%' OR slug ILIKE '%vila%' OR slug ILIKE '%joiosa%');

-- Configurar URLs de agenda para Barcelona
UPDATE cities 
SET agenda_eventos_urls = '[
  "https://www.barcelona.cat/agenda",
  "https://cultura.barcelona.cat/agenda",
  "https://www.barcelona.cat/cultura"
]'
WHERE (name ILIKE '%barcelona%' OR slug ILIKE '%barcelona%');

-- Configurar URLs de agenda para Madrid
UPDATE cities 
SET agenda_eventos_urls = '[
  "https://www.madrid.es/agenda",
  "https://cultura.madrid.es/eventos",
  "https://www.madrid.es/agenda-cultural"
]'
WHERE (name ILIKE '%madrid%' OR slug ILIKE '%madrid%');

-- Configurar URLs de agenda para Valencia
UPDATE cities 
SET agenda_eventos_urls = '[
  "https://www.valencia.es/agenda",
  "https://cultura.valencia.es/eventos",
  "https://www.valencia.es/cultura"
]'
WHERE (name ILIKE '%valencia%' OR slug ILIKE '%valencia%');

-- Verificar la configuración
SELECT 
  name,
  slug,
  agenda_eventos_urls,
  CASE 
    WHEN agenda_eventos_urls IS NOT NULL 
    THEN json_array_length(agenda_eventos_urls) 
    ELSE 0 
  END as num_urls
FROM cities 
WHERE agenda_eventos_urls IS NOT NULL
ORDER BY name;
