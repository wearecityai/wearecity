-- Script completo para verificar configuración de agenda_eventos_urls
-- en ambas tablas: assistant_config y cities

-- 1. Verificar tabla assistant_config (Finetuning Page)
SELECT 
    'assistant_config' as tabla,
    id,
    user_id,
    is_active,
    agenda_eventos_urls,
    CASE 
        WHEN agenda_eventos_urls IS NOT NULL 
        THEN json_array_length(agenda_eventos_urls) 
        ELSE 0 
    END as num_urls,
    created_at,
    updated_at
FROM assistant_config 
WHERE is_active = true
ORDER BY updated_at DESC;

-- 2. Verificar tabla cities
SELECT 
    'cities' as tabla,
    id,
    name,
    slug,
    admin_user_id,
    is_active,
    agenda_eventos_urls,
    CASE 
        WHEN agenda_eventos_urls IS NOT NULL 
        THEN json_array_length(agenda_eventos_urls) 
        ELSE 0 
    END as num_urls
FROM cities 
WHERE is_active = true
  AND (agenda_eventos_urls IS NOT NULL OR name ILIKE '%vila%' OR name ILIKE '%joiosa%')
ORDER BY name;

-- 3. Buscar específicamente La Vila Joiosa en cities
SELECT 
    'vila_joiosa_cities' as tabla,
    id,
    name,
    slug,
    admin_user_id,
    is_active,
    agenda_eventos_urls,
    CASE 
        WHEN agenda_eventos_urls IS NOT NULL 
        THEN json_array_length(agenda_eventos_urls) 
        ELSE 0 
    END as num_urls
FROM cities 
WHERE (name ILIKE '%vila%' OR name ILIKE '%joiosa%' OR slug ILIKE '%vila%' OR slug ILIKE '%joiosa%');

-- 4. Buscar relación entre user_id y cities (si hay admin_user_id)
SELECT 
    'relacion_user_city' as info,
    c.id as city_id,
    c.name as city_name,
    c.slug as city_slug,
    c.admin_user_id,
    ac.id as assistant_config_id,
    ac.user_id as assistant_user_id,
    ac.is_active as assistant_active,
    c.agenda_eventos_urls as city_agenda_urls,
    ac.agenda_eventos_urls as assistant_agenda_urls
FROM cities c
LEFT JOIN assistant_config ac ON c.admin_user_id = ac.user_id AND ac.is_active = true
WHERE c.is_active = true
  AND (c.agenda_eventos_urls IS NOT NULL OR ac.agenda_eventos_urls IS NOT NULL)
ORDER BY c.name;

-- 5. Configuración recomendada si no existe (EJECUTAR SOLO SI ES NECESARIO)
-- Para assistant_config (si tienes el user_id del Finetuning Page):
/*
INSERT INTO assistant_config (user_id, is_active, agenda_eventos_urls, created_at, updated_at)
VALUES (
    'TU_USER_ID_AQUI',
    true,
    '[
        "https://www.villajoyosa.com/agenda-municipal/",
        "https://www.turismolavilajoiosa.com/es/Agenda",
        "https://villajoyosa.es/eventos/",
        "https://cultura.villajoyosa.com/programacion/"
    ]',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    agenda_eventos_urls = EXCLUDED.agenda_eventos_urls,
    updated_at = NOW();
*/

-- Para cities (si prefieres configurarlo a nivel de ciudad):
/*
UPDATE cities 
SET agenda_eventos_urls = '[
    "https://www.villajoyosa.com/agenda-municipal/",
    "https://www.turismolavilajoiosa.com/es/Agenda",
    "https://villajoyosa.es/eventos/",
    "https://cultura.villajoyosa.com/programacion/"
]'
WHERE (name ILIKE '%vila%' OR name ILIKE '%joiosa%' OR slug ILIKE '%vila%' OR slug ILIKE '%joiosa%');
*/
