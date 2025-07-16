-- Índice único para evitar duplicados de localidad en assistant_config
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_restricted_city_place_id
ON assistant_config ((restricted_city->>'place_id')); 