-- Crear el enum user_role que falta
CREATE TYPE public.user_role AS ENUM ('ciudadano', 'administrativo');

-- Verificar que la tabla profiles use este tipo (debería estar ya configurado)
-- pero por si acaso, añadimos comentario explicativo
COMMENT ON TYPE public.user_role IS 'Enum para los roles de usuario: ciudadano (usuario normal) y administrativo (administrador de ciudad)';