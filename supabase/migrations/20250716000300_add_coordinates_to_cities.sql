-- Añadir campos de coordenadas a la tabla cities
ALTER TABLE cities 
ADD COLUMN lat DECIMAL(10, 8),
ADD COLUMN lng DECIMAL(11, 8);

-- Crear índices para búsquedas geográficas
CREATE INDEX IF NOT EXISTS idx_cities_coordinates ON cities(lat, lng);

-- Comentarios para documentación
COMMENT ON COLUMN cities.lat IS 'Latitud del ayuntamiento o punto central de la ciudad';
COMMENT ON COLUMN cities.lng IS 'Longitud del ayuntamiento o punto central de la ciudad'; 