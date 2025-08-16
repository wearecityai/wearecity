-- Script para insertar URLs de agenda de prueba en la tabla cities
-- Esto activará la funcionalidad real de eventos en la edge function

-- Primero, verificar si la tabla cities existe y tiene la columna agenda_eventos_urls
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'cities' 
  AND column_name = 'agenda_eventos_urls';

-- Insertar URLs de agenda para ciudades de prueba
-- Nota: Ajusta los nombres de ciudades según tu base de datos

-- Para La Vila Joiosa
UPDATE cities 
SET agenda_eventos_urls = '["https://www.villajoyosa.com/agenda-municipal/", "https://www.villajoyosa.com/cultura/", "https://www.villajoyosa.com/turismo/"]'
WHERE name ILIKE '%vila joiosa%' OR name ILIKE '%villajoyosa%';

-- Para Barcelona
UPDATE cities 
SET agenda_eventos_urls = '["https://www.barcelona.cat/agenda", "https://cultura.barcelona.cat/agenda", "https://www.barcelona.cat/cultura"]'
WHERE name ILIKE '%barcelona%';

-- Para Madrid
UPDATE cities 
SET agenda_eventos_urls = '["https://www.madrid.es/agenda", "https://cultura.madrid.es/eventos", "https://www.madrid.es/agenda-cultural"]'
WHERE name ILIKE '%madrid%';

-- Para Valencia
UPDATE cities 
SET agenda_eventos_urls = '["https://www.valencia.es/agenda", "https://cultura.valencia.es/eventos", "https://www.valencia.es/cultura"]'
WHERE name ILIKE '%valencia%';

-- Para Bilbao
UPDATE cities 
SET agenda_eventos_urls = '["https://www.bilbao.eus/agenda", "https://cultura.bilbao.eus/eventos", "https://www.bilbao.eus/cultura"]'
WHERE name ILIKE '%bilbao%';

-- Para Sevilla
UPDATE cities 
SET agenda_eventos_urls = '["https://www.sevilla.org/agenda", "https://cultura.sevilla.org/eventos", "https://www.sevilla.org/cultura"]'
WHERE name ILIKE '%sevilla%';

-- Verificar la configuración
SELECT 
  name,
  agenda_eventos_urls,
  updated_at
FROM cities 
WHERE agenda_eventos_urls IS NOT NULL
ORDER BY name;
