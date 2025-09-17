import puppeteer from 'puppeteer';

export interface ScrapedEvent {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  url: string;
}

export interface EventScrapingResult {
  success: boolean;
  events: ScrapedEvent[];
  error?: string;
  scrapedAt: string;
}

/**
 * Scrapes events from La Vila Joiosa official events page
 */
export async function scrapeVillaJoyosaEvents(eventUrl: string = 'https://www.villajoyosa.com/evento/'): Promise<EventScrapingResult> {
  let browser;
  
  try {
    console.log('🕷️ Starting Puppeteer event scraping for:', eventUrl);
    
    // Launch browser with optimized settings for Firebase Functions (faster)
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      timeout: 30000 // 30 second timeout for browser launch
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('🌐 Navigating to events page...');
    await page.goto(eventUrl, { 
      waitUntil: 'domcontentloaded', // Faster than networkidle2
      timeout: 20000 
    });

    // Shorter wait for content to load
    await page.waitForTimeout(1000);

    console.log('📊 Extracting events from page...');
    
    // Extract events using selectors specific to villajoyosa.com
    const events = await page.evaluate(() => {
      const eventElements = document.querySelectorAll('.event-item, .evento-item, [class*="event"], [class*="evento"]');
      const extractedEvents: ScrapedEvent[] = [];

      // If no specific event elements found, try alternative selectors
      let elementsToProcess = eventElements;
      if (eventElements.length === 0) {
        // Try more generic selectors
        elementsToProcess = document.querySelectorAll('article, .post, .entry, [class*="card"]');
      }

      elementsToProcess.forEach((element) => {
        try {
          // Extract title
          const titleElement = element.querySelector('h1, h2, h3, h4, .title, .titulo, [class*="title"]');
          const title = titleElement?.textContent?.trim() || '';

          // Skip if no title or if it doesn't look like an event
          if (!title || title.length < 3) return;

          // Extract date information
          const dateElement = element.querySelector('.date, .fecha, [class*="date"], [class*="fecha"], time');
          let dateText = dateElement?.textContent?.trim() || '';
          
          // Look for date patterns in the text content if no specific date element
          if (!dateText) {
            const textContent = element.textContent || '';
            const dateMatch = textContent.match(/(\d{1,2})\s+(sep|oct|nov|dic|septiembre|octubre|noviembre|diciembre)/i);
            if (dateMatch) {
              dateText = dateMatch[0];
            }
          }

          // Extract time
          const timeElement = element.querySelector('.time, .hora, [class*="time"], [class*="hora"]');
          let timeText = timeElement?.textContent?.trim() || '';
          
          // Look for time patterns if no specific time element
          if (!timeText) {
            const textContent = element.textContent || '';
            const timeMatch = textContent.match(/(\d{1,2}):(\d{2})\s*(am|pm|h)?/i);
            if (timeMatch) {
              timeText = timeMatch[0];
            }
          }

          // Extract location
          const locationElement = element.querySelector('.location, .ubicacion, [class*="location"], [class*="ubicacion"]');
          const location = locationElement?.textContent?.trim() || '';

          // Extract description
          const descElement = element.querySelector('.description, .descripcion, .excerpt, p');
          let description = descElement?.textContent?.trim() || '';
          
          // Limit description length
          if (description.length > 200) {
            description = description.substring(0, 200) + '...';
          }

          // Extract URL
          const linkElement = element.querySelector('a[href]') as HTMLAnchorElement;
          const url = linkElement?.href || '';

          // Only add if we have at least title and some additional info
          if (title && (dateText || timeText || location || description)) {
            extractedEvents.push({
              title: title,
              date: dateText,
              time: timeText,
              location: location,
              description: description,
              url: url
            });
          }
        } catch (error) {
          console.error('Error processing event element:', error);
        }
      });

      return extractedEvents;
    });

    console.log(`✅ Successfully extracted ${events.length} events`);

    // Filter events to current and future dates
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // September = 9, October = 10
    
    const relevantEvents = events.filter(event => {
      // Simple filter for current and next months
      const eventText = event.date.toLowerCase();
      return eventText.includes('sep') || 
             eventText.includes('oct') || 
             eventText.includes('nov') || 
             eventText.includes('dic') ||
             eventText.includes('septiembre') || 
             eventText.includes('octubre') || 
             eventText.includes('noviembre') || 
             eventText.includes('diciembre') ||
             /\d+\s+(sep|oct|nov|dic)/i.test(eventText);
    });

    console.log(`🎯 Found ${relevantEvents.length} relevant events for current/upcoming months`);

    return {
      success: true,
      events: relevantEvents,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in Puppeteer scraping:', error);
    return {
      success: false,
      events: [],
      error: error.message,
      scrapedAt: new Date().toISOString()
    };
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

/**
 * Generic function to scrape events from any municipality website
 */
export async function scrapeEventsFromUrl(url: string, cityName: string): Promise<EventScrapingResult> {
  // For now, we'll use the Villa Joiosa scraper as the base
  // This can be extended to handle different municipality website structures
  if (url.includes('villajoyosa.com')) {
    return await scrapeVillaJoyosaEvents(url);
  }
  
  // For other municipalities, we'd implement specific scrapers
  console.log(`⚠️ No specific scraper implemented for ${url}, using generic approach`);
  return await scrapeVillaJoyosaEvents(url);
}
