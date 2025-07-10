-- Limpiar cualquier transacción pendiente y recrear el trigger si es necesario
-- Primero, verificar que el trigger existe
SELECT trigger_name, event_manipulation, trigger_schema, trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';