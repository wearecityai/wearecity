/**
 * Servicio de scraping automático diario de eventos
 * Procesa todas las ciudades configuradas y extrae eventos desde hoy hasta donde haya eventos
 */

import { firestore } from 'firebase-admin';
import * as puppeteer from 'puppeteer';

interface CityConfig {
  slug: string;
  name: string;
  agendaEventosUrls?: string[];
  isActive?: boolean;
}

interface ScrapedEvent {
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  url?: string;
}

interface ProcessedEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  category: string;
  sourceUrl: string;
  eventDetailUrl?: string;
  citySlug: string;
  cityName: string;
  isActive: boolean;
  isRecurring: boolean;
  tags: string[];
  // Formato específico para EventCards
  eventCard: {
    title: string;
    date: string;
    time?: string;
    location: string;
    description: string;
    category: string;
    url?: string;
    imageUrl?: string;
    price?: string;
    organizer?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  scrapedAt: Date;
}

export class DailyEventsScrapingService {
  private db: firestore.Firestore;

  constructor(db: firestore.Firestore) {
    this.db = db;
  }

  /**
   * Procesar todas las ciudades activas
   */
  async processAllCities(): Promise<any> {
    console.log('🌍 Starting daily events scraping for all cities...');
    
    try {
      // Obtener todas las ciudades activas con URLs de eventos configuradas
      const citiesSnapshot = await this.db
        .collection('cities')
        .where('isActive', '==', true)
        .get();

      const results = {
        totalCities: 0,
        processedCities: 0,
        totalEvents: 0,
        errors: []
      };

      for (const cityDoc of citiesSnapshot.docs) {
        const cityData = cityDoc.data() as CityConfig;
        
        if (cityData.agendaEventosUrls && cityData.agendaEventosUrls.length > 0) {
          results.totalCities++;
          
          try {
            const cityResult = await this.processCityEvents(cityData);
            results.processedCities++;
            results.totalEvents += cityResult.eventsSaved;
            
            console.log(`✅ Processed ${cityData.name}: ${cityResult.eventsSaved} events`);
          } catch (error) {
            const errorMsg = `Failed to process ${cityData.name}: ${error.message}`;
            console.error(`❌ ${errorMsg}`);
            results.errors.push(errorMsg);
          }
        }
      }

      // Guardar log del procesamiento
      await this.saveProcessingLog({
        type: 'daily_automatic_scraping',
        timestamp: new Date(),
        results,
        success: results.errors.length === 0
      });

      console.log('🎉 Daily scraping completed:', results);
      return results;

    } catch (error) {
      console.error('❌ Daily scraping failed:', error);
      await this.saveProcessingLog({
        type: 'daily_automatic_scraping',
        timestamp: new Date(),
        results: { error: error.message },
        success: false
      });
      throw error;
    }
  }

  /**
   * Encontrar el ID real de la ciudad por slug o nombre
   */
  private async findRealCityId(targetSlug: string, targetName: string): Promise<string | null> {
    try {
      console.log(`🔍 Looking for real city ID for: ${targetName} (slug: ${targetSlug})`);
      
      const citiesSnapshot = await this.db.collection('cities').get();
      
      for (const cityDoc of citiesSnapshot.docs) {
        const cityData = cityDoc.data();
        const cityId = cityDoc.id;
        
        // Buscar por múltiples criterios
        const nameMatch = cityData.name?.toLowerCase().includes(targetName.toLowerCase()) ||
                          targetName.toLowerCase().includes(cityData.name?.toLowerCase() || '');
        
        const slugMatch = cityData.slug?.toLowerCase() === targetSlug.toLowerCase() ||
                          cityData.slug?.toLowerCase().includes(targetSlug.toLowerCase()) ||
                          targetSlug.toLowerCase().includes(cityData.slug?.toLowerCase() || '');
        
        if (nameMatch || slugMatch) {
          console.log(`✅ Found real city: ${cityData.name} with ID: ${cityId}`);
          return cityId;
        }
      }
      
      console.log(`❌ No real city found for ${targetName} (${targetSlug})`);
      return null;
      
    } catch (error) {
      console.error('❌ Error finding real city ID:', error);
      return null;
    }
  }

  /**
   * Procesar eventos de una ciudad específica
   */
  async processCityEvents(cityConfig: CityConfig): Promise<any> {
    console.log(`🏙️ Processing events for ${cityConfig.name}...`);

    // 🔧 NUEVO: Encontrar el ID real de la ciudad
    const realCityId = await this.findRealCityId(cityConfig.slug, cityConfig.name);
    
    if (!realCityId) {
      throw new Error(`Cannot find real city ID for ${cityConfig.name} (${cityConfig.slug})`);
    }
    
    console.log(`✅ Using real city ID: ${realCityId} instead of slug: ${cityConfig.slug}`);

    const results = {
      citySlug: cityConfig.slug,
      cityName: cityConfig.name,
      realCityId: realCityId, // Nuevo campo
      eventsExtracted: 0,
      eventsSaved: 0,
      eventsUpdated: 0
    };

    let browser: puppeteer.Browser | null = null;

    try {
      // Configurar Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      const allEvents: ScrapedEvent[] = [];

      // Scraping de todas las URLs configuradas
      for (const url of cityConfig.agendaEventosUrls!) {
        console.log(`🕷️ Scraping: ${url}`);
        
        try {
          const events = await this.scrapeEventsFromUrl(browser, url);
          allEvents.push(...events);
          console.log(`   Found ${events.length} events`);
        } catch (error) {
          console.error(`   ❌ Failed to scrape ${url}:`, error.message);
        }
      }

      results.eventsExtracted = allEvents.length;

      if (allEvents.length > 0) {
        // Procesar eventos con IA
        const processedEvents = await this.processEventsWithAI(allEvents, cityConfig);
        
        // Filtrar solo eventos futuros
        const futureEvents = this.filterFutureEvents(processedEvents);
        
        // 🔧 NUEVO: Guardar usando el ID real de la ciudad
        const saveResults = await this.saveEventsToCity(futureEvents, realCityId);
        results.eventsSaved = saveResults.saved;
        results.eventsUpdated = saveResults.updated;
      }

      return results;

    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Scraping específico para villajoyosa.com (MEC - Modern Events Calendar)
   */
  private async scrapeEventsFromUrl(browser: puppeteer.Browser, url: string): Promise<ScrapedEvent[]> {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('body', { timeout: 10000 }).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Detectar tipo de sitio y usar estrategia apropiada
      if (url.includes('villajoyosa.com')) {
        return await this.scrapeMECEvents(page);
      } else {
        return await this.scrapeGenericEvents(page);
      }

    } finally {
      await page.close();
    }
  }

  /**
   * Scraper específico para MEC (Modern Events Calendar) - CORREGIDO
   */
  private async scrapeMECEvents(page: puppeteer.Page): Promise<ScrapedEvent[]> {
    return await page.evaluate(() => {
      const events: ScrapedEvent[] = [];

      console.log('🏛️ Scraping MEC events (Villa Joyosa)...');

      // Mapeo de meses en español - CORREGIDO
      const abbrevMap: {[key: string]: string} = {
        'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
      };

      // Buscar eventos MEC - ESTOS SELECTORES SÍ FUNCIONAN
      const mecEvents = document.querySelectorAll('.mec-event-article');
      console.log(`🔍 Found ${mecEvents.length} MEC events`);
      
      mecEvents.forEach((eventEl, index) => {
        try {
          // Extraer título - FUNCIONA
          const titleEl = eventEl.querySelector('.mec-event-title a');
          const title = titleEl?.textContent?.trim() || '';
          
          if (!title || title.length < 3) {
            console.log(`⏭️ Skipping MEC event ${index}: no valid title`);
            return;
          }
          
          // Extraer fecha - AQUÍ ESTABA EL PROBLEMA
          const dateEl = eventEl.querySelector('.mec-start-date-label');
          let dateStr = '';
          if (dateEl?.textContent) {
            const dayText = dateEl.textContent.trim(); // Ej: "18 Sep"
            console.log(`🔍 Found date text: "${dayText}"`);
            
            const dayMatch = dayText.match(/(\\d{1,2})\\s+(\\w+)/);
            if (dayMatch) {
              const day = dayMatch[1].padStart(2, '0');
              const monthAbbr = dayMatch[2].toLowerCase().substring(0, 3);
              
              // CORRECCIÓN: Sin fallback problemático
              const month = abbrevMap[monthAbbr];
              if (!month) {
                console.log(`❌ Unknown month abbreviation: "${monthAbbr}"`);
                return; // Saltar evento si no conocemos el mes
              }
              
              const year = '2025'; // Año actual
              dateStr = `${year}-${month}-${day}`;
              console.log(`✅ Extracted date: ${dateStr} from "${dayText}"`);
            } else {
              console.log(`❌ Could not parse date: "${dayText}"`);
              return; // Saltar evento si no se puede parsear la fecha
            }
          } else {
            console.log(`❌ No date element found for event ${index}`);
            return; // Saltar evento sin fecha
          }
          
          // Extraer ubicación - FUNCIONA
          const locationEl = eventEl.querySelector('.mec-event-address span');
          const location = locationEl?.textContent?.trim() || '';
          
          // Extraer descripción - FUNCIONA
          const descEl = eventEl.querySelector('.mec-event-description');
          let description = descEl?.textContent?.trim() || '';
          if (description.length > 300) {
            description = description.substring(0, 300) + '...';
          }
          
          // Extraer URL - FUNCIONA
          const linkEl = eventEl.querySelector('.mec-event-title a');
          const url = (linkEl as HTMLAnchorElement)?.href || '';
          
          // Solo añadir eventos con título y fecha válidos
          if (title && dateStr) {
            events.push({
              title,
              date: dateStr,
              location: location || undefined,
              description: description || undefined,
              url: url || undefined
            });
            console.log(`✅ Added MEC event: ${title} - ${dateStr}`);
          }
        } catch (error) {
          console.error(`❌ Error processing MEC event ${index}:`, error);
        }
      });

      console.log(`🎪 Total MEC events extracted: ${events.length}`);
      return events;
    });
  }

  /**
   * Scraper genérico para otros sitios web
   */
  private async scrapeGenericEvents(page: puppeteer.Page): Promise<ScrapedEvent[]> {
    return await page.evaluate(() => {
      const events: ScrapedEvent[] = [];
      
      // Estrategia genérica: buscar elementos con patrones comunes
      const selectors = [
        '.event', '.evento', 'article', '.post', '.entry', '.item'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        
        if (elements.length > 0) {
          elements.forEach((element) => {
            try {
              // Buscar título
              const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.titulo'];
              let title = '';
              for (const titleSel of titleSelectors) {
                const titleEl = element.querySelector(titleSel);
                if (titleEl?.textContent?.trim()) {
                  title = titleEl.textContent.trim();
                  break;
                }
              }
              
              // Buscar fecha en el texto
              const fullText = element.textContent || '';
              const dateMatches = fullText.match(/\\d{1,2}[\/\\-]\\d{1,2}[\/\\-]\\d{4}/);
              const dateStr = dateMatches ? dateMatches[0] : '';
              
              if (title && title.length > 3) {
                events.push({
                  title,
                  date: dateStr || '',
                  description: fullText.substring(0, 200)
                });
              }
            } catch (error) {
              console.error('Error processing generic event:', error);
            }
          });
          
          break; // Solo usar el primer selector que funcione
        }
      }
      
      return events;
    });
  }

  /**
   * Procesar eventos con IA para clasificación y enriquecimiento
   */
  private async processEventsWithAI(rawEvents: ScrapedEvent[], cityConfig: CityConfig): Promise<ProcessedEvent[]> {
    return rawEvents.map((event, index) => {
      // Normalizar fecha
      let normalizedDate = event.date;
      if (!normalizedDate || !this.isValidDate(normalizedDate)) {
        // Si no hay fecha válida, generar fecha futura
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + index + 1);
        normalizedDate = futureDate.toISOString().split('T')[0];
      }

      // Clasificar categoría
      const category = this.classifyEventCategory(event.title, event.description);
      
      // Generar tags
      const tags = this.generateEventTags(event.title, event.description, category, cityConfig.slug);
      
      // 🔧 NUEVO: Usar un identificador más genérico para el eventId 
      const eventId = `${normalizedDate}_${event.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}_${Date.now()}`;

      // Formatear fecha para EventCard (formato legible)
      const eventDate = new Date(normalizedDate);
      const formattedDate = eventDate.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      return {
        id: eventId,
        title: event.title,
        date: normalizedDate,
        time: event.time || null, // Usar null en lugar de undefined
        location: event.location || cityConfig.name,
        description: event.description || `Evento en ${cityConfig.name}: ${event.title}`,
        category,
        sourceUrl: cityConfig.agendaEventosUrls![0],
        eventDetailUrl: event.url,
        citySlug: cityConfig.slug,
        cityName: cityConfig.name,
        isActive: true,
        isRecurring: false,
        tags,
        // Formato específico para EventCards - listo para mostrar en la AI
        eventCard: {
          title: event.title,
          date: formattedDate,
          time: event.time || null, // Usar null en lugar de undefined
          location: event.location || cityConfig.name,
          description: event.description || `Evento en ${cityConfig.name}: ${event.title}`,
          category: category,
          url: event.url,
          imageUrl: null, // Se puede extraer después si está disponible
          price: null,
          organizer: null
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        scrapedAt: new Date()
      };
    });
  }

  /**
   * Filtrar solo eventos futuros
   */
  private filterFutureEvents(events: ProcessedEvent[]): ProcessedEvent[] {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date >= today);
  }

  /**
   * Guardar eventos en la estructura correcta: cities/{REAL_CITY_ID}/events
   * @param events - Eventos a guardar
   * @param realCityId - ID REAL de la ciudad (no slug), ej: 'hD3P3gXX2ZpxOysxmwEZ'
   */
  private async saveEventsToCity(events: ProcessedEvent[], realCityId: string): Promise<{saved: number, updated: number}> {
    let saved = 0;
    let updated = 0;
    
    const batch = this.db.batch();
    let batchOps = 0;
    
    for (const event of events) {
      try {
        // 🔧 USAR EL ID REAL DE LA CIUDAD, NO EL SLUG
        const eventRef = this.db
          .collection('cities')
          .doc(realCityId)  // <-- ID real como 'hD3P3gXX2ZpxOysxmwEZ'
          .collection('events')
          .doc(event.id);
        
        const existingEvent = await eventRef.get();
        
        if (existingEvent.exists) {
          batch.update(eventRef, {
            ...event,
            updatedAt: new Date()
          });
          updated++;
        } else {
          batch.set(eventRef, event);
          saved++;
        }
        
        batchOps++;
        
        // Ejecutar batch cada 500 operaciones (límite de Firestore)
        if (batchOps >= 500) {
          await batch.commit();
          batchOps = 0;
        }
        
      } catch (error) {
        console.error(`Error saving event "${event.title}":`, error.message);
      }
    }
    
    // Ejecutar operaciones restantes
    if (batchOps > 0) {
      await batch.commit();
    }
    
    return { saved, updated };
  }

  /**
   * Clasificar categoría del evento basándose en IA simple
   */
  private classifyEventCategory(title: string, description?: string): string {
    const titleLower = title.toLowerCase();
    const descLower = (description || '').toLowerCase();
    const fullText = `${titleLower} ${descLower}`;

    if (fullText.includes('concierto') || fullText.includes('música') || fullText.includes('musical') || fullText.includes('concert') || fullText.includes('tributo')) {
      return 'concierto';
    } else if (fullText.includes('teatro') || fullText.includes('obra')) {
      return 'teatro';
    } else if (fullText.includes('danza') || fullText.includes('baile') || fullText.includes('danses')) {
      return 'danza';
    } else if (fullText.includes('cine') || fullText.includes('película') || fullText.includes('film')) {
      return 'cine';
    } else if (fullText.includes('exposición') || fullText.includes('museo') || fullText.includes('arte')) {
      return 'exposicion';
    } else if (fullText.includes('festival') || fullText.includes('fiesta') || fullText.includes('aplec')) {
      return 'festival';
    } else if (fullText.includes('deporte') || fullText.includes('deportivo')) {
      return 'deporte';
    } else if (fullText.includes('cultural') || fullText.includes('cultura')) {
      return 'cultural';
    }
    
    return 'general';
  }

  /**
   * Generar tags automáticos
   */
  private generateEventTags(title: string, description?: string, category?: string, citySlug?: string): string[] {
    const tags: string[] = [];
    
    if (citySlug) tags.push(citySlug);
    tags.push('evento');
    
    const fullText = `${title.toLowerCase()} ${(description || '').toLowerCase()}`;
    
    if (fullText.includes('música') || fullText.includes('musical')) tags.push('musica');
    if (fullText.includes('teatro')) tags.push('teatro');
    if (fullText.includes('danza') || fullText.includes('baile')) tags.push('danza');
    if (fullText.includes('cine')) tags.push('cine');
    if (fullText.includes('cultural') || fullText.includes('cultura')) tags.push('cultura');
    if (fullText.includes('familia')) tags.push('familia');
    if (fullText.includes('gratis') || fullText.includes('gratuito')) tags.push('gratis');
    if (fullText.includes('joven') || fullText.includes('juvenil')) tags.push('joven');
    if (fullText.includes('infantil') || fullText.includes('niños')) tags.push('infantil');
    
    if (category && category !== 'general' && !tags.includes(category)) {
      tags.push(category);
    }
    
    return [...new Set(tags)]; // Eliminar duplicados
  }

  /**
   * Validar si una fecha es válida
   */
  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  }

  /**
   * Extraer precio del texto del evento
   */
  private extractPrice(text: string): string | undefined {
    const pricePatterns = [
      /(\d+)\s*€/,
      /(\d+)\s*euros?/i,
      /precio:\s*(\d+)/i,
      /(\d+)\s*€\s*[\/|]\s*(\d+)\s*€/, // "3 € / 1 €"
      /gratis|gratuito|entrada\s+libre/i
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[0].toLowerCase().includes('gratis') || match[0].toLowerCase().includes('gratuito')) {
          return 'Gratuito';
        }
        return match[0];
      }
    }

    return undefined;
  }

  /**
   * Extraer organizador del texto del evento
   */
  private extractOrganizer(text: string): string | undefined {
    const organizerPatterns = [
      /organiza:\s*([^\.]+)/i,
      /organizador:\s*([^\.]+)/i,
      /cía\.\s*([^\.]+)/i,
      /compañía\s*([^\.]+)/i,
      /grupo\s*([^\.]+)/i,
      /teatro\s*([^\.]+)/i
    ];

    for (const pattern of organizerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Guardar log de procesamiento
   */
  private async saveProcessingLog(logData: any): Promise<void> {
    await this.db
      .collection('events_processing_logs')
      .doc(`daily_scraping_${Date.now()}`)
      .set(logData);
  }
}