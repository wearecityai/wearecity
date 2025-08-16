-- Crear tabla para procedimientos aprendidos por la IA
CREATE TABLE IF NOT EXISTS learned_procedures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city_name TEXT NOT NULL,
    procedure_type TEXT NOT NULL,
    explanation TEXT NOT NULL,
    web_source TEXT,
    test_results JSONB,
    confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_learned_procedures_city ON learned_procedures(city_name);
CREATE INDEX IF NOT EXISTS idx_learned_procedures_type ON learned_procedures(procedure_type);
CREATE INDEX IF NOT EXISTS idx_learned_procedures_active ON learned_procedures(is_active);
CREATE INDEX IF NOT EXISTS idx_learned_procedures_confidence ON learned_procedures(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_learned_procedures_updated ON learned_procedures(updated_at DESC);

-- Crear índice compuesto para búsquedas por ciudad y tipo
CREATE INDEX IF NOT EXISTS idx_learned_procedures_city_type ON learned_procedures(city_name, procedure_type);

-- Crear tabla para el historial de pruebas de la IA
CREATE TABLE IF NOT EXISTS ai_test_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    procedure_id UUID REFERENCES learned_procedures(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL, -- 'initial', 'improvement', 'user_feedback'
    test_data JSONB NOT NULL,
    success BOOLEAN,
    clarity_score INTEGER CHECK (clarity_score >= 1 AND clarity_score <= 5),
    user_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para el historial de pruebas
CREATE INDEX IF NOT EXISTS idx_ai_test_history_procedure ON ai_test_history(procedure_id);
CREATE INDEX IF NOT EXISTS idx_ai_test_history_type ON ai_test_history(test_type);
CREATE INDEX IF NOT EXISTS idx_ai_test_history_success ON ai_test_history(success);
CREATE INDEX IF NOT EXISTS idx_ai_test_history_created ON ai_test_history(created_at DESC);

-- Crear tabla para fuentes web de trámites
CREATE TABLE IF NOT EXISTS procedure_web_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'ayuntamiento', 'sede_electronica', 'informacion_general'
    is_active BOOLEAN DEFAULT true,
    last_scraped TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para fuentes web
CREATE INDEX IF NOT EXISTS idx_procedure_web_sources_city ON procedure_web_sources(city_name);
CREATE INDEX IF NOT EXISTS idx_procedure_web_sources_active ON procedure_web_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_procedure_web_sources_type ON procedure_web_sources(source_type);

-- Insertar fuentes web por defecto para ciudades conocidas
INSERT INTO procedure_web_sources (city_name, source_url, source_type) VALUES
    ('la vila joiosa', 'https://www.villajoyosa.com', 'ayuntamiento'),
    ('la vila joiosa', 'https://www.villajoyosa.com/sede-electronica/', 'sede_electronica'),
    ('la vila joiosa', 'https://www.villajoyosa.com/agenda-municipal/', 'informacion_general'),
    ('finestrat', 'https://www.finestrat.es', 'ayuntamiento'),
    ('benidorm', 'https://www.benidorm.org', 'ayuntamiento')
ON CONFLICT (city_name, source_url) DO NOTHING;

-- Crear función para actualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_learned_procedures_updated_at 
    BEFORE UPDATE ON learned_procedures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procedure_web_sources_updated_at 
    BEFORE UPDATE ON procedure_web_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear función para calcular estadísticas de aprendizaje
CREATE OR REPLACE FUNCTION get_learning_statistics()
RETURNS TABLE (
    total_procedures BIGINT,
    total_cities BIGINT,
    total_procedure_types BIGINT,
    average_confidence DECIMAL(3,2),
    recent_updates BIGINT,
    success_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT lp.id)::BIGINT as total_procedures,
        COUNT(DISTINCT lp.city_name)::BIGINT as total_cities,
        COUNT(DISTINCT lp.procedure_type)::BIGINT as total_procedure_types,
        ROUND(AVG(lp.confidence_score), 2) as average_confidence,
        COUNT(DISTINCT CASE WHEN lp.updated_at > NOW() - INTERVAL '7 days' THEN lp.id END)::BIGINT as recent_updates,
        ROUND(
            (COUNT(DISTINCT CASE WHEN ath.success = true THEN ath.id END)::DECIMAL / 
             NULLIF(COUNT(DISTINCT ath.id), 0)) * 100, 2
        ) as success_rate
    FROM learned_procedures lp
    LEFT JOIN ai_test_history ath ON lp.id = ath.procedure_id
    WHERE lp.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Crear función para buscar procedimientos por similitud
CREATE OR REPLACE FUNCTION search_procedures_by_similarity(
    search_query TEXT,
    city_filter TEXT DEFAULT NULL,
    limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    city_name TEXT,
    procedure_type TEXT,
    explanation TEXT,
    confidence_score DECIMAL(3,2),
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lp.id,
        lp.city_name,
        lp.procedure_type,
        lp.explanation,
        lp.confidence_score,
        similarity(lp.procedure_type || ' ' || lp.explanation, search_query) as similarity_score
    FROM learned_procedures lp
    WHERE lp.is_active = true
        AND (city_filter IS NULL OR lp.city_name ILIKE '%' || city_filter || '%')
        AND (lp.procedure_type ILIKE '%' || search_query || '%' 
             OR lp.explanation ILIKE '%' || search_query || '%')
    ORDER BY similarity_score DESC, lp.confidence_score DESC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Crear vista para procedimientos más populares
CREATE OR REPLACE VIEW popular_procedures AS
SELECT 
    lp.procedure_type,
    lp.city_name,
    COUNT(ath.id) as test_count,
    AVG(ath.clarity_score) as avg_clarity,
    lp.confidence_score,
    lp.updated_at
FROM learned_procedures lp
LEFT JOIN ai_test_history ath ON lp.id = ath.procedure_id
WHERE lp.is_active = true
GROUP BY lp.id, lp.procedure_type, lp.city_name, lp.confidence_score, lp.updated_at
ORDER BY test_count DESC, lp.confidence_score DESC;

-- Crear política RLS para learned_procedures (lectura pública, escritura solo para admins)
ALTER TABLE learned_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learned_procedures_read_policy" ON learned_procedures
    FOR SELECT USING (true);

CREATE POLICY "learned_procedures_insert_policy" ON learned_procedures
    FOR INSERT WITH CHECK (true);

CREATE POLICY "learned_procedures_update_policy" ON learned_procedures
    FOR UPDATE USING (true);

-- Crear política RLS para ai_test_history
ALTER TABLE ai_test_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_test_history_read_policy" ON ai_test_history
    FOR SELECT USING (true);

CREATE POLICY "ai_test_history_insert_policy" ON ai_test_history
    FOR INSERT WITH CHECK (true);

-- Crear política RLS para procedure_web_sources
ALTER TABLE procedure_web_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "procedure_web_sources_read_policy" ON procedure_web_sources
    FOR SELECT USING (true);

CREATE POLICY "procedure_web_sources_insert_policy" ON procedure_web_sources
    FOR INSERT WITH CHECK (true);

-- Comentarios para documentar las tablas
COMMENT ON TABLE learned_procedures IS 'Almacena procedimientos aprendidos automáticamente por la IA';
COMMENT ON TABLE ai_test_history IS 'Historial de pruebas realizadas por la IA para mejorar procedimientos';
COMMENT ON TABLE procedure_web_sources IS 'Fuentes web utilizadas para extraer información de trámites';

COMMENT ON COLUMN learned_procedures.confidence_score IS 'Puntuación de confianza de 0 a 1 (mayor = más confiable)';
COMMENT ON COLUMN ai_test_history.clarity_score IS 'Puntuación de claridad de 1 a 5 (mayor = más claro)';
COMMENT ON COLUMN procedure_web_sources.source_type IS 'Tipo de fuente: ayuntamiento, sede_electronica, informacion_general';
