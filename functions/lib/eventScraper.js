"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeEventsFromUrl = exports.scrapeVillaJoyosaEvents = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
/**
 * Scrapes events from La Vila Joiosa official events page
 */
async function scrapeVillaJoyosaEvents(eventUrl = 'https://www.villajoyosa.com/evento/') {
    let browser;
    try {
        console.log('🕷️ Starting Puppeteer event scraping for:', eventUrl);
        // Launch browser with optimized settings for Firebase Functions (faster)
        browser = await puppeteer_1.default.launch({
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
            waitUntil: 'domcontentloaded',
            timeout: 20000
        });
        // Shorter wait for content to load
        await page.waitForTimeout(1000);
        console.log('📊 Extracting events from page...');
        // Extract events using selectors specific to villajoyosa.com
        const events = await page.evaluate(() => {
            const eventElements = document.querySelectorAll('.event-item, .evento-item, [class*="event"], [class*="evento"]');
            const extractedEvents = [];
            // If no specific event elements found, try alternative selectors
            let elementsToProcess = eventElements;
            if (eventElements.length === 0) {
                // Try more generic selectors
                elementsToProcess = document.querySelectorAll('article, .post, .entry, [class*="card"]');
            }
            elementsToProcess.forEach((element) => {
                var _a, _b, _c, _d, _e;
                try {
                    // Extract title
                    const titleElement = element.querySelector('h1, h2, h3, h4, .title, .titulo, [class*="title"]');
                    const title = ((_a = titleElement === null || titleElement === void 0 ? void 0 : titleElement.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                    // Skip if no title or if it doesn't look like an event
                    if (!title || title.length < 3)
                        return;
                    // Extract date information
                    const dateElement = element.querySelector('.date, .fecha, [class*="date"], [class*="fecha"], time');
                    let dateText = ((_b = dateElement === null || dateElement === void 0 ? void 0 : dateElement.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
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
                    let timeText = ((_c = timeElement === null || timeElement === void 0 ? void 0 : timeElement.textContent) === null || _c === void 0 ? void 0 : _c.trim()) || '';
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
                    const location = ((_d = locationElement === null || locationElement === void 0 ? void 0 : locationElement.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
                    // Extract description
                    const descElement = element.querySelector('.description, .descripcion, .excerpt, p');
                    let description = ((_e = descElement === null || descElement === void 0 ? void 0 : descElement.textContent) === null || _e === void 0 ? void 0 : _e.trim()) || '';
                    // Limit description length
                    if (description.length > 200) {
                        description = description.substring(0, 200) + '...';
                    }
                    // Extract URL
                    const linkElement = element.querySelector('a[href]');
                    const url = (linkElement === null || linkElement === void 0 ? void 0 : linkElement.href) || '';
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
                }
                catch (error) {
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
    }
    catch (error) {
        console.error('❌ Error in Puppeteer scraping:', error);
        return {
            success: false,
            events: [],
            error: error.message,
            scrapedAt: new Date().toISOString()
        };
    }
    finally {
        if (browser) {
            await browser.close();
            console.log('🔒 Browser closed');
        }
    }
}
exports.scrapeVillaJoyosaEvents = scrapeVillaJoyosaEvents;
/**
 * Generic function to scrape events from any municipality website
 */
async function scrapeEventsFromUrl(url, cityName) {
    // For now, we'll use the Villa Joiosa scraper as the base
    // This can be extended to handle different municipality website structures
    if (url.includes('villajoyosa.com')) {
        return await scrapeVillaJoyosaEvents(url);
    }
    // For other municipalities, we'd implement specific scrapers
    console.log(`⚠️ No specific scraper implemented for ${url}, using generic approach`);
    return await scrapeVillaJoyosaEvents(url);
}
exports.scrapeEventsFromUrl = scrapeEventsFromUrl;
//# sourceMappingURL=eventScraper.js.map