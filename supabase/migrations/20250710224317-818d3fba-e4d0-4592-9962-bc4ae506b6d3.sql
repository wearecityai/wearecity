-- Agregar columna profile_image_url a la tabla cities
ALTER TABLE public.cities 
ADD COLUMN profile_image_url text;

-- Agregar comentario para documentar la columna
COMMENT ON COLUMN public.cities.profile_image_url IS 'URL de la imagen de perfil del asistente';