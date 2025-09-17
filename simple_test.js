// Script simple para testear algunas preguntas del modelo
const https = require('https');

// Función para hacer una llamada HTTP a la función de Firebase
function callFirebaseFunction(question, cityContext = 'La Vila Joiosa') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      data: {
        query: question,
        citySlug: 'la-vila-joiosa',
        cityContext: cityContext,
        conversationHistory: []
      }
    });

    const options = {
      hostname: 'processaichat-7gaozpdiza-uc.a.run.app',
      port: 443,
      path: '/wearecity-2ab89/us-central1/processAIChat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(new Error('Error parsing response: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Función para evaluar una respuesta
function evaluateResponse(question, response, category) {
  const evaluation = {
    question,
    category,
    response: response.substring(0, 300) + (response.length > 300 ? '...' : ''),
    length: response.length,
    clarity: 0,
    conciseness: 0,
    precision: 0,
    utility: 0,
    structure: 0,
    sources: 0,
    overall: 0,
    issues: [],
    suggestions: []
  };

  // Evaluar claridad (0-10)
  if (response.includes('No puedo') || response.includes('No tengo información')) {
    evaluation.clarity = 2;
    evaluation.issues.push('Respuesta genérica sin información específica');
  } else if (response.length < 100) {
    evaluation.clarity = 4;
    evaluation.issues.push('Respuesta demasiado corta');
  } else if (response.length > 600) {
    evaluation.clarity = 6;
    evaluation.issues.push('Respuesta demasiado larga');
  } else {
    evaluation.clarity = 8;
  }

  // Evaluar concisión (0-10)
  const idealLength = category === 'tramites' ? 300 : category === 'historia' ? 400 : 250;
  const lengthDiff = Math.abs(response.length - idealLength);
  if (lengthDiff < 50) {
    evaluation.conciseness = 9;
  } else if (lengthDiff < 100) {
    evaluation.conciseness = 7;
  } else if (lengthDiff < 200) {
    evaluation.conciseness = 5;
  } else {
    evaluation.conciseness = 3;
    evaluation.issues.push('Longitud inadecuada para el tipo de pregunta');
  }

  // Evaluar precisión (0-10)
  if (response.includes('ayuntamiento') || response.includes('municipal') || response.includes('oficina')) {
    evaluation.precision = 8;
  } else if (response.includes('puedo') || response.includes('debe') || response.includes('necesita')) {
    evaluation.precision = 6;
  } else {
    evaluation.precision = 4;
    evaluation.issues.push('Falta información específica y práctica');
  }

  // Evaluar utilidad (0-10)
  if (response.includes('dirección') || response.includes('horario') || response.includes('teléfono') || response.includes('web')) {
    evaluation.utility = 9;
  } else if (response.includes('pasos') || response.includes('proceso') || response.includes('documentos')) {
    evaluation.utility = 7;
  } else {
    evaluation.utility = 5;
    evaluation.issues.push('Falta información práctica');
  }

  // Evaluar estructura (0-10)
  if (response.includes('1.') || response.includes('•') || response.includes('-') || response.includes('Primero')) {
    evaluation.structure = 8;
  } else if (response.includes('Además') || response.includes('También') || response.includes('Por otro lado')) {
    evaluation.structure = 6;
  } else {
    evaluation.structure = 4;
    evaluation.issues.push('Falta estructura clara');
  }

  // Evaluar fuentes (0-10)
  if (response.includes('ayuntamiento') || response.includes('municipal') || response.includes('oficial')) {
    evaluation.sources = 8;
  } else if (response.includes('recomiendo') || response.includes('sugiero')) {
    evaluation.sources = 5;
  } else {
    evaluation.sources = 3;
    evaluation.issues.push('Falta referencia a fuentes oficiales');
  }

  // Calcular puntuación general
  evaluation.overall = Math.round(
    (evaluation.clarity + evaluation.conciseness + evaluation.precision + 
     evaluation.utility + evaluation.structure + evaluation.sources) / 6
  );

  return evaluation;
}

// Preguntas de prueba
const testQuestions = [
  { question: "¿Cómo puedo empadronarme en la ciudad?", category: "tramites" },
  { question: "¿Dónde está el ayuntamiento?", category: "lugares" },
  { question: "¿Qué eventos hay este fin de semana?", category: "eventos" },
  { question: "¿Cuál es la historia de la ciudad?", category: "historia" },
  { question: "¿Cómo llego al aeropuerto?", category: "transporte" },
  { question: "¿Qué puedo visitar en un día?", category: "turismo" }
];

// Función principal
async function runTests() {
  console.log('🚀 Iniciando análisis de respuestas del modelo...\n');
  
  const results = [];
  
  for (const test of testQuestions) {
    try {
      console.log(`\n🔍 Testeando: ${test.question}`);
      
      const result = await callFirebaseFunction(test.question);
      const response = result.data?.response || 'Sin respuesta';
      
      const evaluation = evaluateResponse(test.question, response, test.category);
      results.push(evaluation);
      
      console.log(`📊 Evaluación: ${evaluation.overall}/10`);
      console.log(`📝 Longitud: ${evaluation.length} caracteres`);
      console.log(`📄 Respuesta: ${evaluation.response}`);
      
      if (evaluation.issues.length > 0) {
        console.log(`⚠️ Problemas: ${evaluation.issues.join(', ')}`);
      }
      
      // Pausa entre preguntas
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  // Generar reporte
  console.log('\n📊 REPORTE DE ANÁLISIS');
  console.log('='.repeat(50));
  
  const avgScore = results.reduce((sum, evaluation) => sum + evaluation.overall, 0) / results.length;
  const totalIssues = results.reduce((sum, evaluation) => sum + evaluation.issues.length, 0);
  
  console.log(`\n📈 Puntuación promedio: ${avgScore.toFixed(1)}/10`);
  console.log(`⚠️ Total de problemas: ${totalIssues}`);
  console.log(`🔢 Preguntas testadas: ${results.length}`);
  
  // Identificar problemas comunes
  const commonIssues = {};
  results.forEach(evaluation => {
    evaluation.issues.forEach(issue => {
      commonIssues[issue] = (commonIssues[issue] || 0) + 1;
    });
  });
  
  console.log('\n🔍 Problemas más frecuentes:');
  Object.entries(commonIssues)
    .sort(([,a], [,b]) => b - a)
    .forEach(([issue, count]) => {
      console.log(`   ${issue}: ${count} veces`);
    });
  
  return results;
}

// Ejecutar
runTests().catch(console.error);
