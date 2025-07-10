-- Agregar campo is_public a la tabla cities si no existe
ALTER TABLE cities ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Eliminar las tablas que ya no necesitamos
DROP TABLE IF EXISTS admin_finetuning_config CASCADE;
DROP TABLE IF EXISTS admin_chats CASCADE;

-- Actualizar RLS policies para cities
DROP POLICY IF EXISTS "Users can view all active cities" ON cities;
DROP POLICY IF EXISTS "Admins can manage their own city" ON cities;

-- Nuevas policies más específicas
CREATE POLICY "Everyone can view public active cities" 
ON cities FOR SELECT 
USING (is_active = true AND is_public = true);

CREATE POLICY "Admins can view their own cities" 
ON cities FOR SELECT 
USING (auth.uid() = admin_user_id);

CREATE POLICY "Admins can manage their own city" 
ON cities FOR ALL 
USING (auth.uid() = admin_user_id);