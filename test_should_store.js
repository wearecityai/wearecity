// Test function to verify shouldStoreInDynamicRAG logic

function shouldStoreInDynamicRAG(query, response) {
    // Palabras que indican consultas no relevantes para RAG
    const nonRelevantWords = [
        'hola', 'gracias', 'sí', 'no', 'ok', 'vale', 'buenos', 'días', 'tardes', 'noches',
        'cómo estás', 'qué tal', 'adiós', 'hasta luego', 'nos vemos'
    ];
    
    // Palabras que indican consultas relevantes para RAG
    const relevantWords = [
        'tramite', 'tramites', 'procedimiento', 'procedimientos', 'gestion', 'gestiones',
        'ayuntamiento', 'municipio', 'alcaldia', 'gobierno local', 'administracion municipal',
        'empadronamiento', 'empadronar', 'padron', 'censo', 'domicilio', 'residencia',
        'licencia', 'licencias', 'permiso', 'permisos', 'autorizacion', 'autorizaciones',
        'certificado', 'certificados', 'documento', 'documentos', 'formulario', 'formularios',
        'como solicitar', 'como obtener', 'como presentar', 'como hacer', 'como tramitar',
        'donde solicitar', 'donde presentar', 'donde ir', 'donde acudir',
        'que necesito', 'que documentos', 'que requisitos', 'que papeles',
        'horarios', 'atencion', 'oficina', 'registro', 'sede electronica'
    ];
    
    const queryLower = query.toLowerCase();
    const responseLower = response.toLowerCase();
    
    console.log('🔍 Testing shouldStoreInDynamicRAG:');
    console.log('Query:', query);
    console.log('Query lower:', queryLower);
    
    // Si la consulta contiene palabras no relevantes, no almacenar
    const hasNonRelevantWords = nonRelevantWords.some(word => queryLower.includes(word));
    console.log('Has non-relevant words:', hasNonRelevantWords);
    
    if (hasNonRelevantWords && !relevantWords.some(word => queryLower.includes(word))) {
        console.log('❌ Skipping - contains non-relevant words only');
        return false;
    }
    
    // Si la consulta contiene palabras relevantes, almacenar
    const hasRelevantWords = relevantWords.some(word => queryLower.includes(word));
    console.log('Has relevant words:', hasRelevantWords);
    console.log('Relevant words found:', relevantWords.filter(word => queryLower.includes(word)));
    
    if (hasRelevantWords) {
        console.log('✅ Storing - contains relevant words');
        return true;
    }
    
    // Si la respuesta es muy corta (saludos, agradecimientos), no almacenar
    if (response.length < 100) {
        console.log('❌ Skipping - response too short');
        return false;
    }
    
    // Si la respuesta contiene información específica sobre trámites, almacenar
    const hasSpecificInfo = relevantWords.some(word => responseLower.includes(word));
    console.log('Response has specific info:', hasSpecificInfo);
    console.log('Specific info words found:', relevantWords.filter(word => responseLower.includes(word)));
    
    if (hasSpecificInfo) {
        console.log('✅ Storing - response contains specific info');
        return true;
    }
    
    // Por defecto, no almacenar
    console.log('❌ Skipping - no relevant criteria met');
    return false;
}

// Test cases
const testCases = [
    {
        query: 'hola',
        response: '¡Hola! ¿En qué puedo ayudarte?',
        expected: false
    },
    {
        query: '¿cómo puedo empadronarme en La Vila Joiosa?',
        response: 'Para empadronarte necesitas acudir al ayuntamiento con tu documento de identidad y justificante de domicilio.',
        expected: true
    },
    {
        query: '¿qué necesito para empadronarme?',
        response: 'Para empadronarte necesitas presentar tu DNI y un justificante de domicilio como una factura de suministros.',
        expected: true
    },
    {
        query: 'gracias',
        response: '¡De nada!',
        expected: false
    }
];

console.log('🧪 Testing shouldStoreInDynamicRAG function...\n');

testCases.forEach((testCase, index) => {
    console.log(`\n--- Test Case ${index + 1} ---`);
    const result = shouldStoreInDynamicRAG(testCase.query, testCase.response);
    console.log(`Expected: ${testCase.expected}, Got: ${result}`);
    console.log(`Result: ${result === testCase.expected ? '✅ PASS' : '❌ FAIL'}`);
});
