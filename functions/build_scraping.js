const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔨 Compilando funciones de scraping inteligente...');

try {
  // Compilar solo las funciones de scraping
  execSync('npx tsc --target es2020 --module commonjs --outDir lib --skipLibCheck src/intelligentScrapingAgent.ts src/intelligentScrapingFunction.ts src/intelligentScrapingIndex.ts', { 
    stdio: 'inherit',
    cwd: '/Users/tonillorens/Desktop/wearecity_app/functions'
  });
  
  console.log('✅ Compilación de scraping completada');
} catch (error) {
  console.error('❌ Error compilando:', error.message);
  process.exit(1);
}