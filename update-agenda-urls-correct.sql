-- Actualizar URLs de agenda con formato correcto para La Vila Joiosa
-- Basado en la configuración actual: ["https://www.villajoyosa.com/evento/"]

UPDATE cities 
SET agenda_eventos_urls = '[
  "https://www.villajoyosa.com/agenda-municipal/",
  "https://www.villajoyosa.com/cultura/",
  "https://www.villajoyosa.com/turismo/",
  "https://www.villajoyosa.com/evento/",
  "https://www.turismolavilajoiosa.com/es/Agenda",
  "https://villajoyosa.es/eventos/",
  "https://cultura.villajoyosa.com/programacion/"
]'
WHERE (name ILIKE '%vila joiosa%' OR name ILIKE '%villajoyosa%' OR slug ILIKE '%vila%' OR slug ILIKE '%joiosa%')
  AND agenda_eventos_urls IS NOT NULL;

-- Verificar la actualización
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
WHERE (name ILIKE '%vila joiosa%' OR name ILIKE '%villajoyosa%' OR slug ILIKE '%vila%' OR slug ILIKE '%joiosa%')
ORDER BY name;
