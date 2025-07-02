
-- Add a column to store the base system instruction that will be combined with user's custom instruction
ALTER TABLE public.assistant_config 
ADD COLUMN base_system_instruction text DEFAULT 'Eres un asistente especializado en información sobre ciudades españolas y sus trámites administrativos. Proporciona información precisa, actualizada y útil sobre procedimientos municipales, servicios públicos y cualquier consulta relacionada con la administración local. Sé claro, conciso y siempre útil en tus respuestas.';

-- Add a comment to explain the purpose of this column
COMMENT ON COLUMN public.assistant_config.base_system_instruction IS 'Base system instruction that is combined with user custom instructions. This provides the core behavior and cannot be directly modified by users.';
