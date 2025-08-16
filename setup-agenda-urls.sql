-- Script para configurar URLs de agenda de prueba
-- Esto activará la funcionalidad real de eventos en la edge function

-- Insertar configuración de agenda para ciudades de prueba
INSERT INTO assistant_config (
  user_id,
  is_active,
  agenda_eventos_urls,
  restricted_city,
  created_at,
  updated_at
) VALUES (
  'test-user-123',
  true,
  '["https://www.barcelona.cat/agenda", "https://cultura.barcelona.cat/agenda", "https://www.madrid.es/agenda", "https://cultura.madrid.es/eventos"]',
  '{"name": "Barcelona", "lat": 41.3851, "lng": 2.1734}',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  agenda_eventos_urls = EXCLUDED.agenda_eventos_urls,
  restricted_city = EXCLUDED.restricted_city,
  updated_at = NOW();

-- También insertar para Madrid
INSERT INTO assistant_config (
  user_id,
  is_active,
  agenda_eventos_urls,
  restricted_city,
  created_at,
  updated_at
) VALUES (
  'test-user-madrid',
  true,
  '["https://www.madrid.es/agenda", "https://cultura.madrid.es/eventos", "https://www.madrid.es/agenda-cultural"]',
  '{"name": "Madrid", "lat": 40.4168, "lng": -3.7038}',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  agenda_eventos_urls = EXCLUDED.agenda_eventos_urls,
  restricted_city = EXCLUDED.restricted_city,
  updated_at = NOW();

-- Verificar la configuración
SELECT 
  user_id,
  is_active,
  agenda_eventos_urls,
  restricted_city,
  created_at,
  updated_at
FROM assistant_config 
WHERE is_active = true;
