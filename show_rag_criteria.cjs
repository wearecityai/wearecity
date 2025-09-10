// Script para mostrar los criterios del RAG dinámico

console.log('🔍 === CRITERIOS DEL RAG DINÁMICO ===\n');

console.log('📋 CRITERIOS PARA ALMACENAR:');
console.log('1. ✅ PALABRAS RELEVANTES EN LA CONSULTA:');
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
console.log('   - Trámites:', relevantWords.slice(0, 6).join(', '));
console.log('   - Instituciones:', relevantWords.slice(6, 10).join(', '));
console.log('   - Documentos:', relevantWords.slice(10, 16).join(', '));
console.log('   - Acciones:', relevantWords.slice(16, 22).join(', '));
console.log('   - Ubicaciones:', relevantWords.slice(22, 26).join(', '));

console.log('\n2. ✅ RESPUESTA LARGA (>100 caracteres)');
console.log('   - Si la respuesta tiene más de 100 caracteres, se almacena');

console.log('\n3. ✅ INFORMACIÓN ESPECÍFICA EN LA RESPUESTA');
console.log('   - Si la respuesta contiene palabras relevantes, se almacena');

console.log('\n❌ CRITERIOS PARA NO ALMACENAR:');
console.log('1. ❌ PALABRAS NO RELEVANTES EN LA CONSULTA:');
const nonRelevantWords = [
    'hola', 'gracias', 'sí', 'no', 'ok', 'vale', 'buenos', 'días', 'tardes', 'noches',
    'cómo estás', 'qué tal', 'adiós', 'hasta luego', 'nos vemos'
];
console.log('   - Saludos:', nonRelevantWords.slice(0, 5).join(', '));
console.log('   - Despedidas:', nonRelevantWords.slice(5, 10).join(', '));

console.log('\n2. ❌ RESPUESTA MUY CORTA (<100 caracteres)');
console.log('   - Si la respuesta tiene menos de 100 caracteres, NO se almacena');

console.log('\n3. ❌ CONSULTA SOLO CON PALABRAS NO RELEVANTES');
console.log('   - Si la consulta solo contiene saludos/despedidas, NO se almacena');

console.log('\n📊 === FLUJO DE DECISIÓN ===');
console.log('1. ¿La consulta contiene palabras relevantes? → SÍ → ALMACENAR');
console.log('2. ¿La consulta contiene solo palabras no relevantes? → SÍ → NO ALMACENAR');
console.log('3. ¿La respuesta tiene más de 100 caracteres? → NO → NO ALMACENAR');
console.log('4. ¿La respuesta contiene información específica? → SÍ → ALMACENAR');
console.log('5. Por defecto → NO ALMACENAR');

console.log('\n🧪 === EJEMPLOS ===');
console.log('✅ ALMACENAR:');
console.log('   - "¿cómo empadronarme?" → Contiene "empadronar"');
console.log('   - "hola, quiero una licencia" → Contiene "licencia"');
console.log('   - "¿qué tal?" → Respuesta larga sobre trámites');

console.log('\n❌ NO ALMACENAR:');
console.log('   - "hola" → Solo saludo');
console.log('   - "gracias" → Solo agradecimiento');
console.log('   - "¿cómo estás?" → Solo saludo');
console.log('   - "ok" → Respuesta muy corta');
