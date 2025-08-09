#!/usr/bin/env node

/**
 * Script para validar que todos los archivos de idioma tienen las mismas claves
 * Compara cada archivo de idioma con el archivo de referencia (español)
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const REFERENCE_LANG = 'es';

function flattenObject(obj, prefix = '') {
  const result = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(result, flattenObject(obj[key], newKey));
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  
  return result;
}

function validateTranslations() {
  console.log('🔍 Validando traducciones...\n');
  
  // Cargar archivo de referencia
  const referencePath = path.join(LOCALES_DIR, `${REFERENCE_LANG}.json`);
  if (!fs.existsSync(referencePath)) {
    console.error(`❌ Archivo de referencia ${REFERENCE_LANG}.json no encontrado`);
    process.exit(1);
  }
  
  const referenceData = JSON.parse(fs.readFileSync(referencePath, 'utf8'));
  const referenceKeys = flattenObject(referenceData);
  const referenceKeysList = Object.keys(referenceKeys).sort();
  
  console.log(`📚 Archivo de referencia: ${REFERENCE_LANG}.json`);
  console.log(`🔢 Total de claves: ${referenceKeysList.length}\n`);
  
  // Obtener todos los archivos de idioma
  const localeFiles = fs.readdirSync(LOCALES_DIR)
    .filter(file => file.endsWith('.json') && file !== `${REFERENCE_LANG}.json`)
    .map(file => file.replace('.json', ''));
  
  let hasErrors = false;
  
  // Validar cada archivo
  for (const locale of localeFiles) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    const localeData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const localeKeys = flattenObject(localeData);
    const localeKeysList = Object.keys(localeKeys).sort();
    
    console.log(`🌍 Validando ${locale}.json...`);
    
    // Buscar claves faltantes
    const missingKeys = referenceKeysList.filter(key => !localeKeysList.includes(key));
    
    // Buscar claves extra
    const extraKeys = localeKeysList.filter(key => !referenceKeysList.includes(key));
    
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`  ✅ Completado al 100% (${localeKeysList.length}/${referenceKeysList.length} claves)`);
    } else {
      hasErrors = true;
      const completion = ((localeKeysList.length - extraKeys.length) / referenceKeysList.length * 100).toFixed(1);
      console.log(`  ❌ Completado al ${completion}% (${localeKeysList.length - extraKeys.length}/${referenceKeysList.length} claves)`);
      
      if (missingKeys.length > 0) {
        console.log(`  📝 Claves faltantes (${missingKeys.length}):`);
        missingKeys.slice(0, 10).forEach(key => console.log(`    - ${key}`));
        if (missingKeys.length > 10) {
          console.log(`    ... y ${missingKeys.length - 10} más`);
        }
      }
      
      if (extraKeys.length > 0) {
        console.log(`  🔄 Claves extra (${extraKeys.length}):`);
        extraKeys.slice(0, 5).forEach(key => console.log(`    + ${key}`));
        if (extraKeys.length > 5) {
          console.log(`    ... y ${extraKeys.length - 5} más`);
        }
      }
    }
    
    console.log('');
  }
  
  // Resumen final
  console.log('📊 RESUMEN:');
  console.log(`  Idioma de referencia: ${REFERENCE_LANG} (${referenceKeysList.length} claves)`);
  console.log(`  Idiomas validados: ${localeFiles.length}`);
  
  if (hasErrors) {
    console.log('  ❌ Algunos idiomas están incompletos');
    process.exit(1);
  } else {
    console.log('  ✅ Todos los idiomas están completos al 100%');
  }
}

// Ejecutar validación
try {
  validateTranslations();
} catch (error) {
  console.error('❌ Error durante la validación:', error.message);
  process.exit(1);
}