#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE PRUEBA DEL SISTEMA DE IA AUTO-APRENDIZAJE
 * 
 * Este script demuestra cómo funciona el sistema completo
 */

import { createClient } from '@supabase/supabase-js';
import { extractProcedureInfoWithBrowserMCP } from './browser-mcp-integration.js';

// Configuración de Supabase
const supabase = createClient(
  'https://irghpvvoparqettcnpnh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo'
);

console.log('🧪 Iniciando pruebas del Sistema de IA Auto-Aprendizaje...');
console.log('========================================================');

// Función para probar extracción con Browser MCP
async function testBrowserMCPExtraction() {
  console.log('\n🌐 PRUEBA 1: Extracción con Browser MCP');
  console.log('----------------------------------------');
  
  try {
    const cityName = 'la vila joiosa';
    const procedureType = 'empadronamiento';
    
    console.log(`🎯 Probando extracción para: ${cityName} - ${procedureType}`);
    
    const result = await extractProcedureInfoWithBrowserMCP(cityName, procedureType);
    
    if (result) {
      console.log('✅ Extracción exitosa:');
      console.log(`   Título: ${result.title}`);
      console.log(`   Contenido: ${result.content.substring(0, 100)}...`);
      console.log(`   Pasos encontrados: ${result.steps.length}`);
      result.steps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
    } else {
      console.log('❌ Extracción falló');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en prueba de Browser MCP:', error);
    return null;
  }
}

// Función para probar almacenamiento en base de datos
async function testDatabaseStorage() {
  console.log('\n💾 PRUEBA 2: Almacenamiento en Base de Datos');
  console.log('----------------------------------------------');
  
  try {
    // Verificar si la tabla existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'learned_procedures');
    
    if (tablesError) {
      console.log('⚠️ No se pudo verificar la tabla (puede que no exista aún)');
      return false;
    }
    
    if (tables.length === 0) {
      console.log('⚠️ La tabla learned_procedures no existe');
      console.log('   Ejecuta la migración: supabase/migrations/20250101000000_create_learned_procedures.sql');
      return false;
    }
    
    console.log('✅ Tabla learned_procedures encontrada');
    
    // Insertar un procedimiento de prueba
    const testProcedure = {
      city_name: 'test_city',
      procedure_type: 'test_procedure',
      explanation: 'Este es un procedimiento de prueba para verificar el sistema',
      web_source: 'https://test.example.com',
      test_results: { success: true, clarityScore: 4 },
      confidence_score: 0.8
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('learned_procedures')
      .insert(testProcedure)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error insertando procedimiento de prueba:', insertError);
      return false;
    }
    
    console.log('✅ Procedimiento de prueba insertado con ID:', inserted.id);
    
    // Verificar que se puede leer
    const { data: read, error: readError } = await supabase
      .from('learned_procedures')
      .select('*')
      .eq('id', inserted.id)
      .single();
    
    if (readError) {
      console.error('❌ Error leyendo procedimiento:', readError);
      return false;
    }
    
    console.log('✅ Procedimiento leído correctamente:', read.procedure_type);
    
    // Limpiar procedimiento de prueba
    const { error: deleteError } = await supabase
      .from('learned_procedures')
      .delete()
      .eq('id', inserted.id);
    
    if (deleteError) {
      console.error('⚠️ Error eliminando procedimiento de prueba:', deleteError);
    } else {
      console.log('✅ Procedimiento de prueba eliminado');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en prueba de base de datos:', error);
    return false;
  }
}

// Función para probar búsqueda de procedimientos
async function testProcedureSearch() {
  console.log('\n🔍 PRUEBA 3: Búsqueda de Procedimientos');
  console.log('------------------------------------------');
  
  try {
    // Insertar algunos procedimientos de prueba
    const testProcedures = [
      {
        city_name: 'la vila joiosa',
        procedure_type: 'empadronamiento',
        explanation: 'Proceso para empadronarse en La Vila Joiosa',
        web_source: 'https://www.villajoyosa.com',
        test_results: { success: true, clarityScore: 4 },
        confidence_score: 0.9
      },
      {
        city_name: 'finestrat',
        procedure_type: 'licencia_comercial',
        explanation: 'Licencia para abrir un negocio en Finestrat',
        web_source: 'https://www.finestrat.es',
        test_results: { success: true, clarityScore: 5 },
        confidence_score: 0.8
      }
    ];
    
    const { data: inserted, error: insertError } = await supabase
      .from('learned_procedures')
      .insert(testProcedures)
      .select();
    
    if (insertError) {
      console.error('❌ Error insertando procedimientos de prueba:', insertError);
      return false;
    }
    
    console.log(`✅ ${inserted.length} procedimientos de prueba insertados`);
    
    // Probar búsqueda por ciudad
    const { data: cityResults, error: cityError } = await supabase
      .from('learned_procedures')
      .select('*')
      .eq('city_name', 'la vila joiosa');
    
    if (cityError) {
      console.error('❌ Error buscando por ciudad:', cityError);
      return false;
    }
    
    console.log(`✅ Búsqueda por ciudad: ${cityResults.length} resultados`);
    
    // Probar búsqueda por tipo
    const { data: typeResults, error: typeError } = await supabase
      .from('learned_procedures')
      .select('*')
      .eq('procedure_type', 'empadronamiento');
    
    if (typeError) {
      console.error('❌ Error buscando por tipo:', typeError);
      return false;
    }
    
    console.log(`✅ Búsqueda por tipo: ${typeResults.length} resultados`);
    
    // Limpiar procedimientos de prueba
    const { error: deleteError } = await supabase
      .from('learned_procedures')
      .delete()
      .in('id', inserted.map(p => p.id));
    
    if (deleteError) {
      console.error('⚠️ Error eliminando procedimientos de prueba:', deleteError);
    } else {
      console.log('✅ Procedimientos de prueba eliminados');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en prueba de búsqueda:', error);
    return false;
  }
}

// Función para probar estadísticas
async function testStatistics() {
  console.log('\n📊 PRUEBA 4: Estadísticas del Sistema');
  console.log('---------------------------------------');
  
  try {
    // Verificar si la función de estadísticas existe
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'get_learning_statistics');
    
    if (functionsError) {
      console.log('⚠️ No se pudo verificar la función de estadísticas');
      return false;
    }
    
    if (functions.length === 0) {
      console.log('⚠️ La función get_learning_statistics no existe');
      return false;
    }
    
    console.log('✅ Función de estadísticas encontrada');
    
    // Probar la función de estadísticas
    const { data: stats, error: statsError } = await supabase
      .rpc('get_learning_statistics');
    
    if (statsError) {
      console.error('❌ Error ejecutando función de estadísticas:', statsError);
      return false;
    }
    
    if (stats && stats.length > 0) {
      const stat = stats[0];
      console.log('✅ Estadísticas obtenidas:');
      console.log(`   Total procedimientos: ${stat.total_procedures}`);
      console.log(`   Total ciudades: ${stat.total_cities}`);
      console.log(`   Tipos de procedimientos: ${stat.total_procedure_types}`);
      console.log(`   Confianza promedio: ${stat.average_confidence}`);
      console.log(`   Actualizaciones recientes: ${stat.recent_updates}`);
      console.log(`   Tasa de éxito: ${stat.success_rate}%`);
    } else {
      console.log('⚠️ No se obtuvieron estadísticas (tabla puede estar vacía)');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en prueba de estadísticas:', error);
    return false;
  }
}

// Función principal de pruebas
async function runAllTests() {
  console.log('🚀 Iniciando todas las pruebas...\n');
  
  const results = {
    browserMCP: false,
    database: false,
    search: false,
    statistics: false
  };
  
  try {
    // Prueba 1: Browser MCP
    results.browserMCP = await testBrowserMCPExtraction();
    
    // Prueba 2: Base de datos
    results.database = await testDatabaseStorage();
    
    // Prueba 3: Búsqueda
    if (results.database) {
      results.search = await testProcedureSearch();
    }
    
    // Prueba 4: Estadísticas
    if (results.database) {
      results.statistics = await testStatistics();
    }
    
  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
  }
  
  // Resumen de resultados
  console.log('\n📋 RESUMEN DE PRUEBAS');
  console.log('=====================');
  console.log(`🌐 Browser MCP: ${results.browserMCP ? '✅ PASÓ' : '❌ FALLÓ'}`);
  console.log(`💾 Base de datos: ${results.database ? '✅ PASÓ' : '❌ FALLÓ'}`);
  console.log(`🔍 Búsqueda: ${results.search ? '✅ PASÓ' : '❌ FALLÓ'}`);
  console.log(`📊 Estadísticas: ${results.statistics ? '✅ PASÓ' : '❌ FALLÓ'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 RESULTADO FINAL: ${passedTests}/${totalTests} pruebas pasaron`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todas las pruebas pasaron! El sistema está funcionando correctamente.');
  } else {
    console.log('⚠️ Algunas pruebas fallaron. Revisa los errores anteriores.');
  }
  
  return results;
}

// Ejecutar pruebas si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testBrowserMCPExtraction, testDatabaseStorage, testProcedureSearch, testStatistics };
