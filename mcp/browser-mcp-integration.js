#!/usr/bin/env node

/**
 * 🌐 INTEGRACIÓN CON BROWSER MCP
 * 
 * Este módulo proporciona funciones para usar Browser MCP real
 * para extraer información de sitios web de ayuntamientos
 */

import { spawn } from 'child_process';

// Configuración de Browser MCP
const BROWSER_MCP_COMMAND = 'node';
const BROWSER_MCP_ARGS = ['mcp/start-browsermcp-server.js'];

/**
 * Clase para manejar la comunicación con Browser MCP
 */
class BrowserMCPClient {
  constructor() {
    this.process = null;
    this.isConnected = false;
  }

  /**
   * Iniciar el servidor Browser MCP
   */
  async start() {
    return new Promise((resolve, reject) => {
      console.log('🌐 Iniciando Browser MCP...');
      
      this.process = spawn(BROWSER_MCP_COMMAND, BROWSER_MCP_ARGS, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('🌐 Browser MCP:', output);
        
        if (output.includes('Browser MCP server started')) {
          this.isConnected = true;
          resolve(true);
        }
      });

      this.process.stderr.on('data', (data) => {
        console.error('🌐 Browser MCP Error:', data.toString());
      });

      this.process.on('close', (code) => {
        console.log(`🌐 Browser MCP cerrado con código: ${code}`);
        this.isConnected = false;
      });

      // Timeout de seguridad
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Timeout iniciando Browser MCP'));
        }
      }, 10000);
    });
  }

  /**
   * Detener el servidor Browser MCP
   */
  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.isConnected = false;
      console.log('🌐 Browser MCP detenido');
    }
  }

  /**
   * Ejecutar comando en Browser MCP
   */
  async executeCommand(command) {
    if (!this.isConnected) {
      throw new Error('Browser MCP no está conectado');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ejecutando comando'));
      }, 30000);

      this.process.stdin.write(command + '\n');
      
      let response = '';
      const dataHandler = (data) => {
        response += data.toString();
        if (response.includes('RESULT:')) {
          clearTimeout(timeout);
          this.process.stdout.removeListener('data', dataHandler);
          resolve(response);
        }
      };
      
      this.process.stdout.on('data', dataHandler);
    });
  }
}

/**
 * Función para extraer información de trámites usando Browser MCP
 */
export async function extractProcedureInfoWithBrowserMCP(cityName, procedureType) {
  const browserMCP = new BrowserMCPClient();
  
  try {
    console.log(`🌐 Iniciando extracción con Browser MCP para ${cityName} - ${procedureType}`);
    
    // 1. Iniciar Browser MCP
    await browserMCP.start();
    
    // 2. Determinar URL del ayuntamiento
    const ayuntamientoUrl = getAyuntamientoUrl(cityName);
    if (!ayuntamientoUrl) {
      throw new Error(`No se pudo determinar URL del ayuntamiento para ${cityName}`);
    }
    
    console.log(`🔗 Navegando a: ${ayuntamientoUrl}`);
    
    // 3. Navegar al sitio web
    const navigateCommand = `@browsermcp navigate ${ayuntamientoUrl}`;
    await browserMCP.executeCommand(navigateCommand);
    
    // 4. Esperar a que cargue la página
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Buscar sección de trámites
    const searchCommand = `@browsermcp search "trámites"`;
    const searchResult = await browserMCP.executeCommand(searchCommand);
    
    // 6. Extraer contenido de la página
    const extractCommand = `@browsermcp extractText`;
    const extractedContent = await browserMCP.executeCommand(extractCommand);
    
    // 7. Buscar información específica del trámite
    const procedureInfo = await searchProcedureInContent(extractedContent, procedureType);
    
    // 8. Si no se encuentra, buscar en secciones específicas
    if (!procedureInfo) {
      const sectionsCommand = `@browsermcp findElements "a[href*='tramite'], a[href*='procedimiento'], a[href*='servicio']"`;
      const sections = await browserMCP.executeCommand(sectionsCommand);
      
      // Navegar a cada sección relevante
      for (const section of sections.slice(0, 3)) { // Máximo 3 secciones
        try {
          const sectionCommand = `@browsermcp click "${section}"`;
          await browserMCP.executeCommand(sectionCommand);
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const sectionContent = await browserMCP.executeCommand(`@browsermcp extractText`);
          const sectionInfo = await searchProcedureInContent(sectionContent, procedureType);
          
          if (sectionInfo) {
            return {
              source: ayuntamientoUrl,
              content: sectionInfo.content,
              title: sectionInfo.title,
              steps: sectionInfo.steps,
              section: section
            };
          }
        } catch (error) {
          console.log(`⚠️ Error en sección ${section}:`, error.message);
          continue;
        }
      }
    }
    
    return procedureInfo;
    
  } catch (error) {
    console.error('❌ Error en extractProcedureInfoWithBrowserMCP:', error);
    return null;
  } finally {
    browserMCP.stop();
  }
}

/**
 * Buscar información del trámite en el contenido extraído
 */
async function searchProcedureInContent(content, procedureType) {
  console.log(`🔍 Buscando información de ${procedureType} en el contenido...`);
  
  // Mapear tipos de trámites a palabras clave
  const procedureKeywords = {
    'empadronamiento': ['empadronamiento', 'empadronar', 'padrón', 'censo', 'residente'],
    'licencia_comercial': ['licencia', 'comercial', 'actividad', 'negocio', 'local'],
    'certificado_residencia': ['certificado', 'residencia', 'domicilio', 'habitual'],
    'licencia_obra': ['licencia', 'obra', 'construcción', 'reforma', 'edificación'],
    'impuesto_ibi': ['ibi', 'impuesto', 'bienes', 'inmuebles', 'contribución'],
    'basuras': ['basuras', 'residuos', 'limpieza', 'recogida', 'contenedores']
  };
  
  const keywords = procedureKeywords[procedureType] || [procedureType];
  
  // Buscar contenido relevante
  const relevantContent = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      relevantContent.push(line.trim());
    }
  }
  
  if (relevantContent.length === 0) {
    console.log(`❌ No se encontró información relevante para ${procedureType}`);
    return null;
  }
  
  console.log(`✅ Encontradas ${relevantContent.length} líneas relevantes`);
  
  // Extraer pasos del procedimiento
  const steps = extractProcedureSteps(relevantContent, procedureType);
  
  // Crear título y descripción
  const title = generateProcedureTitle(procedureType, relevantContent);
  const description = generateProcedureDescription(relevantContent);
  
  return {
    title,
    content: description,
    steps
  };
}

/**
 * Extraer pasos del procedimiento del contenido
 */
function extractProcedureSteps(content, procedureType) {
  const steps = [];
  
  // Buscar patrones de pasos numerados
  const stepPatterns = [
    /^(\d+)[\.\)]\s*(.+)$/i,
    /^(\d+)[\.\)]\s*(.+)$/i,
    /^paso\s*(\d+)[:\.]\s*(.+)$/i,
    /^(\d+)[\.\)]\s*(.+)$/i
  ];
  
  for (const line of content) {
    for (const pattern of stepPatterns) {
      const match = line.match(pattern);
      if (match) {
        steps.push(match[2].trim());
        break;
      }
    }
  }
  
  // Si no se encontraron pasos numerados, buscar por palabras clave
  if (steps.length === 0) {
    const stepKeywords = ['documentación', 'presentar', 'solicitud', 'pago', 'recoger', 'entrega'];
    
    for (const line of content) {
      const lowerLine = line.toLowerCase();
      if (stepKeywords.some(keyword => lowerLine.includes(keyword))) {
        steps.push(line.trim());
      }
    }
  }
  
  // Si aún no hay pasos, crear pasos genéricos basados en el tipo
  if (steps.length === 0) {
    steps.push(...generateGenericSteps(procedureType));
  }
  
  return steps.slice(0, 8); // Máximo 8 pasos
}

/**
 * Generar pasos genéricos para un tipo de trámite
 */
function generateGenericSteps(procedureType) {
  const genericSteps = {
    'empadronamiento': [
      'Documentación requerida: DNI y justificante de domicilio',
      'Presentar solicitud en el ayuntamiento o sede electrónica',
      'Esperar confirmación del empadronamiento',
      'Recibir certificado de empadronamiento'
    ],
    'licencia_comercial': [
      'Preparar documentación técnica del local',
      'Presentar solicitud con documentación completa',
      'Esperar resolución del expediente',
      'Pagar tasas correspondientes',
      'Recibir licencia de actividad'
    ],
    'certificado_residencia': [
      'Solicitar certificado en el ayuntamiento',
      'Verificar datos personales',
      'Pagar tasa si es requerida',
      'Recibir certificado oficial'
    ]
  };
  
  return genericSteps[procedureType] || [
    'Consultar documentación requerida',
    'Preparar solicitud',
    'Presentar en el ayuntamiento',
    'Esperar resolución',
    'Recibir documentación'
  ];
}

/**
 * Generar título del procedimiento
 */
function generateProcedureTitle(procedureType, content) {
  const titles = {
    'empadronamiento': 'Empadronamiento de Residentes',
    'licencia_comercial': 'Licencia de Actividad Comercial',
    'certificado_residencia': 'Certificado de Residencia',
    'licencia_obra': 'Licencia de Obra',
    'impuesto_ibi': 'Impuesto sobre Bienes Inmuebles (IBI)',
    'basuras': 'Servicio de Recogida de Basuras'
  };
  
  return titles[procedureType] || `Trámite de ${procedureType.replace('_', ' ')}`;
}

/**
 * Generar descripción del procedimiento
 */
function generateProcedureDescription(content) {
  // Tomar las primeras líneas relevantes como descripción
  const relevantLines = content.filter(line => line.length > 20).slice(0, 3);
  return relevantLines.join(' ') || 'Información extraída del sitio web oficial del ayuntamiento';
}

/**
 * Obtener URL del ayuntamiento
 */
function getAyuntamientoUrl(cityName) {
  const cityUrls = {
    'la vila joiosa': 'https://www.villajoyosa.com',
    'villajoyosa': 'https://www.villajoyosa.com',
    'finestrat': 'https://www.finestrat.es',
    'benidorm': 'https://www.benidorm.org',
    'alicante': 'https://www.alicante.es',
    'elche': 'https://www.elche.es',
    'torrevieja': 'https://www.torrevieja.es'
  };
  
  const normalizedName = cityName.toLowerCase().trim();
  return cityUrls[normalizedName] || null;
}

/**
 * Función para hacer screenshot de la página
 */
export async function takeScreenshot(url, filename) {
  const browserMCP = new BrowserMCPClient();
  
  try {
    await browserMCP.start();
    
    // Navegar a la URL
    await browserMCP.executeCommand(`@browsermcp navigate ${url}`);
    
    // Esperar a que cargue
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Hacer screenshot
    const screenshotCommand = `@browsermcp screenshot ${filename}`;
    await browserMCP.executeCommand(screenshotCommand);
    
    console.log(`📸 Screenshot guardado como: ${filename}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error tomando screenshot:', error);
    return false;
  } finally {
    browserMCP.stop();
  }
}

/**
 * Función para extraer enlaces de trámites
 */
export async function extractProcedureLinks(url) {
  const browserMCP = new BrowserMCPClient();
  
  try {
    await browserMCP.start();
    
    // Navegar a la URL
    await browserMCP.executeCommand(`@browsermcp navigate ${url}`);
    
    // Esperar a que cargue
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Buscar enlaces de trámites
    const linksCommand = `@browsermcp findElements "a[href*='tramite'], a[href*='procedimiento'], a[href*='servicio'], a[href*='sede']"`;
    const links = await browserMCP.executeCommand(linksCommand);
    
    // Extraer texto y URLs de los enlaces
    const procedureLinks = [];
    for (const link of links.slice(0, 10)) { // Máximo 10 enlaces
      try {
        const textCommand = `@browsermcp getText "${link}"`;
        const text = await browserMCP.executeCommand(textCommand);
        
        const hrefCommand = `@browsermcp getAttribute "${link}" href`;
        const href = await browserMCP.executeCommand(hrefCommand);
        
        if (text && href) {
          procedureLinks.push({
            text: text.trim(),
            url: href,
            element: link
          });
        }
      } catch (error) {
        console.log(`⚠️ Error extrayendo enlace ${link}:`, error.message);
        continue;
      }
    }
    
    return procedureLinks;
    
  } catch (error) {
    console.error('❌ Error extrayendo enlaces:', error);
    return [];
  } finally {
    browserMCP.stop();
  }
}

// Exportar funciones principales
export {
  BrowserMCPClient,
  extractProcedureInfoWithBrowserMCP
};
