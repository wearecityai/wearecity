// Test the query classification logic

function classifyQueryComplexity(query) {
    // Detectar consultas institucionales primero
    const institutionalIndicators = [
        'tramite', 'tramites', 'procedimiento', 'procedimientos', 'gestion', 'gestiones',
        'ayuntamiento', 'municipio', 'alcaldia', 'gobierno local', 'administracion municipal',
        'sede electronica', 'portal ciudadano', 'atencion ciudadana', 'oficina virtual',
        'certificado', 'certificados', 'documento', 'documentos', 'formulario', 'formularios',
        'empadronamiento', 'empadronar', 'padron', 'censo', 'domicilio', 'residencia',
        'licencia', 'licencias', 'permiso', 'permisos', 'autorizacion', 'autorizaciones',
        'tasa', 'tasas', 'impuesto', 'impuestos', 'tributo', 'tributos', 'pago', 'pagos',
        'cita previa', 'cita', 'citas', 'reserva', 'reservas', 'turno', 'turnos',
        'como solicitar', 'como obtener', 'como presentar', 'como hacer', 'como tramitar',
        'donde solicitar', 'donde presentar', 'donde ir', 'donde acudir',
        'que necesito', 'que documentos', 'que requisitos', 'que papeles',
        'documentacion', 'requisitos', 'pasos', 'proceso', 'tramitacion'
    ];
    
    const queryNormalized = query.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    
    // Verificar si es consulta institucional
    const hasInstitutionalIntent = institutionalIndicators.some(indicator => {
        const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(queryNormalized);
    });
    
    if (hasInstitutionalIntent) {
        console.log('🏛️ Institutional query detected - will use Gemini 2.5 Pro with grounding');
        return 'institutional';
    }
    
    const complexIndicators = [
        'buscar', 'busca', 'encuentra', 'localizar', 'ubicar', 'donde está', 'dónde está',
        'información actual', 'noticias', 'eventos', 'horarios', 'agenda', 'tiempo real',
        'analizar', 'comparar', 'evaluar', 'explicar en detalle', 'profundizar',
        'múltiples', 'varios', 'opciones', 'alternativas',
        'paso a paso', 'proceso', 'procedimiento', 'cómo hacer', 'tutorial',
        'imagen', 'foto', 'mapa', 'ubicación', 'documento', 'pdf',
        'restaurante', 'hotel', 'tienda', 'museo', 'parque', 'lugar', 'sitio'
    ];
    
    const simpleIndicators = [
        'hola', 'gracias', 'sí', 'no', 'ok', 'vale',
        'qué tal', 'cómo estás', 'buenos días', 'buenas tardes',
        'definir', 'qué es', 'significa'
    ];
    
    const queryLower = query.toLowerCase();
    
    // Check for simple indicators first
    const foundSimpleIndicators = simpleIndicators.filter(indicator => {
        const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(queryLower);
    });
    
    if (foundSimpleIndicators.length > 0) {
        console.log('✅ Found simple indicators:', foundSimpleIndicators);
        return 'simple';
    }
    
    // Check for complex indicators (using word boundary matching)
    const foundComplexIndicators = complexIndicators.filter(indicator => {
        const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(queryLower);
    });
    
    if (foundComplexIndicators.length > 0) {
        console.log('✅ Found complex indicators:', foundComplexIndicators);
        return 'complex';
    }
    
    if (query.length > 100 || query.split(' ').length > 20) {
        console.log('✅ Query length/complexity triggers complex classification');
        return 'complex';
    }
    
    console.log('✅ Defaulting to simple classification');
    return 'simple';
}

// Test queries
const testQueries = [
    '¿en qué ciudad estoy?',
    '¿dónde me encuentro?',
    '¿cuál es mi ubicación?',
    'hola',
    '¿qué eventos hay?',
    '¿dónde puedo comer?'
];

console.log('🧪 Testing Query Classification...\n');

testQueries.forEach((query, index) => {
    console.log(`--- Test ${index + 1}: "${query}" ---`);
    const classification = classifyQueryComplexity(query);
    console.log(`Classification: ${classification}`);
    console.log('');
});
