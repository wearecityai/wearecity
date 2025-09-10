// Script para probar la detección de consultas de trámites

function isTramitesQuery(query) {
    const tramitesKeywords = [
        // Trámites generales
        'tramite', 'tramites', 'procedimiento', 'procedimientos', 'gestion', 'gestiones',
        'solicitud', 'solicitudes', 'solicitar', 'obtener', 'conseguir',
        
        // Instituciones municipales
        'ayuntamiento', 'municipio', 'alcaldia', 'gobierno local', 'administracion municipal',
        'sede electronica', 'oficina', 'registro', 'atencion ciudadana',
        
        // Trámites específicos
        'empadronamiento', 'empadronar', 'padron', 'censo', 'domicilio', 'residencia',
        'licencia', 'licencias', 'permiso', 'permisos', 'autorizacion', 'autorizaciones',
        'certificado', 'certificados', 'documento', 'documentos', 'formulario', 'formularios',
        'bono', 'pase', 'transporte', 'subvencion', 'subvenciones', 'ayuda', 'ayudas',
        'impuesto', 'impuestos', 'tasa', 'tasas', 'multa', 'multas', 'sancion', 'sanciones',
        
        // Acciones relacionadas
        'como solicitar', 'como obtener', 'como presentar', 'como hacer', 'como tramitar',
        'donde solicitar', 'donde presentar', 'donde ir', 'donde acudir',
        'que necesito', 'que documentos', 'que requisitos', 'que papeles',
        'horarios', 'atencion', 'cita previa', 'cita', 'turno',
        
        // Servicios municipales
        'basura', 'residuos', 'limpieza', 'alumbrado', 'agua', 'alcantarillado',
        'parques', 'jardines', 'deportes', 'cultura', 'biblioteca', 'centro social'
    ];
    
    const queryLower = query.toLowerCase();
    
    console.log(`🔍 Testing query: "${query}"`);
    console.log(`🔍 Query lower: "${queryLower}"`);
    
    // Buscar coincidencias con palabras clave de trámites
    const matches = [];
    const hasTramitesKeywords = tramitesKeywords.some(keyword => {
        // Búsqueda exacta
        if (queryLower.includes(keyword)) {
            matches.push(keyword);
            return true;
        }
        
        // Búsqueda de variaciones para palabras relacionadas
        if (keyword.includes('empadron') || keyword.includes('padron')) {
            if (queryLower.includes('empadron') || queryLower.includes('padron') || 
                queryLower.includes('empadronar') || queryLower.includes('empadronamiento')) {
                matches.push(keyword + ' (variation)');
                return true;
            }
        }
        
        if (keyword.includes('tramit') || keyword.includes('procedim')) {
            if (queryLower.includes('tramit') || queryLower.includes('procedim') ||
                queryLower.includes('tramite') || queryLower.includes('procedimiento')) {
                matches.push(keyword + ' (variation)');
                return true;
            }
        }
        
        return false;
    });
    
    console.log(`🔍 Matches found: [${matches.join(', ')}]`);
    console.log(`🔍 Is tramites query: ${hasTramitesKeywords}`);
    console.log('   ---');
    
    return hasTramitesKeywords;
}

// Probar con diferentes consultas
const testQueries = [
    'quiero solicitar una licencia de vado',
    '¿cómo me empadrono?',
    'necesito un certificado de empadronamiento',
    '¿dónde puedo solicitar el bono de transporte?',
    '¿qué documentos necesito para una licencia?',
    'hola',
    '¿qué tiempo hace?',
    '¿qué eventos hay este fin de semana?'
];

console.log('🧪 Testing Tramites Detection...\n');

testQueries.forEach(query => {
    isTramitesQuery(query);
});
