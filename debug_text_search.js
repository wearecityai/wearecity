// Debug text search logic

function debugTextSearch(query) {
    console.log('🔍 Debugging text search logic...');
    console.log('Query:', query);
    
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 3);
    console.log('Query words (length > 3):', queryWords);
    
    // Filtrar palabras muy comunes que no deberían activar RAG
    const commonWords = ['hola', 'gracias', 'sí', 'no', 'ok', 'vale', 'buenos', 'días', 'tardes', 'noches'];
    const filteredQueryWords = queryWords.filter(word => !commonWords.includes(word));
    console.log('Filtered query words:', filteredQueryWords);
    
    // Si no hay palabras significativas después del filtro, no buscar en RAG
    if (filteredQueryWords.length === 0) {
        console.log('❌ Query contains only common words, skipping dynamic RAG search');
        return;
    }
    
    // Simular contenido de chunk (ejemplo de lo que podría estar almacenado)
    const chunkContent = "Para empadronarte en La Vila Joiosa, necesitas acudir al Ayuntamiento con tu documento de identidad y justificante de domicilio. El proceso es sencillo y puedes solicitar cita previa.";
    console.log('Chunk content:', chunkContent);
    
    const content = chunkContent.toLowerCase();
    console.log('Content lower:', content);
    
    // Buscar coincidencias con palabras significativas
    const matches = filteredQueryWords.filter(word => content.includes(word));
    console.log('Matches found:', matches);
    
    // Requerir al menos 1 coincidencia o 30% de las palabras para considerar relevante
    const matchThreshold = Math.max(1, Math.ceil(filteredQueryWords.length * 0.3));
    console.log('Match threshold:', matchThreshold);
    console.log('Matches count:', matches.length);
    console.log('Is relevant:', matches.length >= matchThreshold);
}

// Test cases
const testQueries = [
    '¿cómo empadronarme?',
    '¿qué necesito para empadronarme?',
    'empadronamiento',
    'hola',
    '¿cómo puedo empadronarme en La Vila Joiosa?'
];

testQueries.forEach((query, index) => {
    console.log(`\n--- Test ${index + 1}: "${query}" ---`);
    debugTextSearch(query);
});
