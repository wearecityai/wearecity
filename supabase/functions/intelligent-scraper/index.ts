import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapingJob {
  websiteId: string
  baseUrl: string
  maxPages: number
  allowedDomains: string[]
}

interface ScrapedPage {
  url: string
  title: string
  content: string
  status_code: number
  page_type: string
}

serve(async (req) => {
  console.log(`=== INTELLIGENT SCRAPER EDGE FUNCTION START ===`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log(`Method: ${req.method}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? `Set` : 'MISSING',
      supabaseKey: supabaseKey ? `Set` : 'MISSING'
    })

    if (!supabaseUrl || !supabaseKey) {
      const missingVars = []
      if (!supabaseUrl) missingVars.push('SUPABASE_URL')
      if (!supabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
      
      console.error('Missing environment variables:', missingVars)
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
    }

    // Parse request body
    let requestBody
    try {
      const rawBody = await req.text()
      console.log('Raw request body received')
      
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Request body is empty')
      }
      
      requestBody = JSON.parse(rawBody)
      console.log('Request parsed successfully')
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      throw new Error(`Invalid JSON in request body: ${parseError.message}`)
    }

    const { websiteId, action = 'scrape' } = requestBody

    if (!websiteId) {
      console.error('Missing websiteId in request')
      throw new Error('websiteId is required')
    }

    console.log(`Processing action: ${action} for website: ${websiteId}`)

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase client created successfully')

    if (action === 'scrape') {
      console.log(`=== STARTING SCRAPING PROCESS ===`)
      console.log(`Website ID: ${websiteId}`)

      // Get website configuration
      console.log('Fetching website configuration from database...')
      const { data: website, error: websiteError } = await supabase
        .from('scraped_websites')
        .select('*')
        .eq('id', websiteId)
        .single()

      if (websiteError) {
        console.error('Database error fetching website:', websiteError)
        throw new Error(`Website not found in database: ${websiteError.message}`)
      }

      if (!website) {
        console.error('Website not found: query returned null')
        throw new Error(`Website with ID ${websiteId} not found`)
      }

      console.log(`Website configuration loaded: ${website.name}`)

      if (!website.is_active) {
        console.warn('Website is marked as inactive')
        throw new Error('Website is currently inactive')
      }

      // Validate website URL
      try {
        new URL(website.base_url)
        console.log('Website URL validated successfully')
      } catch (urlError) {
        console.error('Invalid website URL:', website.base_url)
        throw new Error(`Invalid website URL: ${website.base_url}`)
      }

      // IMMEDIATE RESPONSE: Start background scraping and return immediately
      console.log('=== STARTING BACKGROUND SCRAPING ===')
      
      // Use EdgeRuntime.waitUntil to run scraping in background
      const backgroundScrapingPromise = performBackgroundScraping(
        supabase,
        {
          websiteId: website.id,
          baseUrl: website.base_url,
          maxPages: Math.min(website.max_pages || 25, 50), // Reduced max pages
          allowedDomains: website.allowed_domains || []
        }
      )

      // Start background task
      EdgeRuntime.waitUntil(backgroundScrapingPromise)

      // Update website status to "scraping in progress"
      await supabase
        .from('scraped_websites')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', websiteId)

      // Return immediate success response
      console.log('=== RETURNING IMMEDIATE SUCCESS RESPONSE ===')
      return new Response(
        JSON.stringify({
          success: true,
          message: `Scraping iniciado en segundo plano para "${website.name}". Los resultados se guardarán automáticamente.`,
          status: 'background_processing',
          websiteId: websiteId,
          estimatedTime: '2-5 minutos'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 202, // Accepted - processing in background
        }
      )
    }

    console.error('Invalid action requested:', action)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Invalid action: ${action}` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )

  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===')
    console.error('Error details:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Background scraping function that runs without blocking the response
async function performBackgroundScraping(supabase: any, job: ScrapingJob): Promise<void> {
  const startTime = Date.now()
  console.log(`=== BACKGROUND SCRAPING STARTED ===`)
  console.log(`Website ID: ${job.websiteId}`)
  console.log(`Base URL: ${job.baseUrl}`)
  console.log(`Max pages: ${job.maxPages}`)

  try {
    // Perform the actual scraping
    const scrapedPages = await scrapeWebsiteOptimized(job)
    const scrapingDuration = Date.now() - startTime
    
    console.log(`=== SCRAPING COMPLETED ===`)
    console.log(`Duration: ${scrapingDuration}ms`)
    console.log(`Pages found: ${scrapedPages.length}`)

    // Save scraped pages to database
    console.log('=== SAVING TO DATABASE ===')
    let savedPagesCount = 0
    let savedDocumentsCount = 0
    let processingErrors: string[] = []

    // Process pages in smaller batches to avoid memory issues
    const BATCH_SIZE = 3
    for (let i = 0; i < scrapedPages.length; i += BATCH_SIZE) {
      const batch = scrapedPages.slice(i, i + BATCH_SIZE)
      
      for (const page of batch) {
        try {
          console.log(`Processing page: ${page.url}`)

          // Skip invalid pages
          if (!page.url || !page.title || !page.content || page.content.length < 100) {
            console.warn(`Skipping invalid page: ${page.url}`)
            continue
          }

          // Calculate content hash for deduplication
          const contentHash = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(page.content)
          )
          const hashArray = Array.from(new Uint8Array(contentHash))
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

          // Check if page already exists with same content
          const { data: existingPage } = await supabase
            .from('scraped_pages')
            .select('id')
            .eq('website_id', job.websiteId)
            .eq('url', page.url)
            .eq('content_hash', hashHex)
            .maybeSingle()

          if (existingPage) {
            console.log(`Page already exists with same content: ${page.url}`)
            continue
          }

          // Insert or update page
          const { data: savedPage, error: pageError } = await supabase
            .from('scraped_pages')
            .upsert({
              website_id: job.websiteId,
              url: page.url,
              title: page.title.substring(0, 500), // Limit title length
              content: page.content.substring(0, 50000), // Limit content length
              content_hash: hashHex,
              page_type: page.page_type,
              status_code: page.status_code,
              last_scraped_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'website_id,url'
            })
            .select()
            .single()

          if (pageError) {
            console.error(`Error saving page ${page.url}:`, pageError)
            processingErrors.push(`Save error for ${page.url}: ${pageError.message}`)
            continue
          }

          savedPagesCount++
          console.log(`✓ Page saved: ${page.url}`)

          // Extract and save documents
          const documents = extractDocuments(page.content, page.url)
          for (const doc of documents.slice(0, 5)) { // Limit documents per page
            try {
              const { error: docError } = await supabase
                .from('scraped_documents')
                .upsert({
                  page_id: savedPage.id,
                  filename: doc.filename.substring(0, 255),
                  file_url: doc.url,
                  file_type: doc.type,
                  download_status: 'pending'
                }, {
                  onConflict: 'page_id,file_url'
                })

              if (!docError) {
                savedDocumentsCount++
              }
            } catch (docError) {
              console.error(`Error saving document:`, docError)
            }
          }

        } catch (pageError) {
          console.error(`Error processing page ${page.url}:`, pageError)
          processingErrors.push(`Page processing error: ${pageError.message}`)
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Update website's last_scraped_at timestamp
    await supabase
      .from('scraped_websites')
      .update({ 
        last_scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', job.websiteId)

    console.log(`=== BACKGROUND SCRAPING COMPLETED ===`)
    console.log(`Pages saved: ${savedPagesCount}`)
    console.log(`Documents found: ${savedDocumentsCount}`)
    console.log(`Total duration: ${Date.now() - startTime}ms`)

  } catch (error) {
    console.error('=== BACKGROUND SCRAPING FAILED ===')
    console.error('Error:', error)
    
    // Mark website as having an error (you could add an error_message column)
    try {
      await supabase
        .from('scraped_websites')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', job.websiteId)
    } catch (updateError) {
      console.error('Failed to update website after error:', updateError)
    }
  }
}

// Optimized scraping function with better performance
async function scrapeWebsiteOptimized(job: ScrapingJob): Promise<ScrapedPage[]> {
  const pages: ScrapedPage[] = []
  const visitedUrls = new Set<string>()
  const urlsToVisit = [job.baseUrl]
  const MAX_CONCURRENT_REQUESTS = 2 // Reduced concurrent requests
  const REQUEST_TIMEOUT = 15000 // Reduced timeout to 15 seconds

  console.log(`=== STARTING OPTIMIZED SCRAPING ===`)
  console.log(`Base URL: ${job.baseUrl}`)
  console.log(`Max pages: ${job.maxPages}`)

  // Fetch with timeout and better error handling
  const fetchWithTimeout = async (url: string): Promise<Response | null> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Municipal-Assistant-Bot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5',
          'Connection': 'keep-alive'
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`Fetch error for ${url}:`, error.message)
      return null
    }
  }

  // Process URLs in smaller batches
  while (urlsToVisit.length > 0 && pages.length < job.maxPages) {
    const currentBatch = urlsToVisit.splice(0, MAX_CONCURRENT_REQUESTS)
    const batchPromises = currentBatch.map(async (url) => {
      if (visitedUrls.has(url)) return null
      visitedUrls.add(url)

      const response = await fetchWithTimeout(url)
      if (!response || !response.ok) return null

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) return null

      const html = await response.text()
      if (html.length < 200) return null

      const cleanedContent = extractTextContent(html)
      const title = extractTitle(html)

      if (cleanedContent.length < 100) return null

      // Extract new URLs for next batch (limited)
      if (pages.length < job.maxPages - 5) {
        const newUrls = extractLinks(html, url, job.baseUrl, job.allowedDomains)
        const urlsToAdd = newUrls.slice(0, 3).filter(newUrl => 
          !visitedUrls.has(newUrl) && !urlsToVisit.includes(newUrl)
        )
        urlsToVisit.push(...urlsToAdd)
      }

      return {
        url,
        title,
        content: cleanedContent,
        status_code: response.status,
        page_type: 'html'
      }
    })

    const batchResults = await Promise.all(batchPromises)
    const validPages = batchResults.filter(page => page !== null) as ScrapedPage[]
    pages.push(...validPages)

    console.log(`Batch completed. Total pages: ${pages.length}, Remaining URLs: ${urlsToVisit.length}`)

    // Respectful delay between batches
    if (urlsToVisit.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`=== SCRAPING SUMMARY ===`)
  console.log(`Total URLs visited: ${visitedUrls.size}`)
  console.log(`Pages with content: ${pages.length}`)

  return pages
}

function extractTextContent(html: string): string {
  // Remove script and style elements
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  
  // Remove HTML tags but keep some structure
  content = content.replace(/<[^>]+>/g, ' ')
  
  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim()
  
  // Remove common navigation and footer content
  const lines = content.split('\n')
  const cleanLines = lines.filter(line => {
    const lower = line.toLowerCase()
    return !lower.includes('cookie') && 
           !lower.includes('navigation') && 
           !lower.includes('menu principal') &&
           line.length > 20
  })
  
  return cleanLines.join('\n').substring(0, 10000) // Limit content size
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1Match) {
    return h1Match[1].replace(/<[^>]+>/g, '').trim()
  }
  
  return 'Sin título'
}

function extractLinks(html: string, currentUrl: string, baseUrl: string, allowedDomains: string[]): string[] {
  const links: string[] = []
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
  
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      let url = match[1]
      
      // Skip non-http links
      if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        continue
      }
      
      // Convert relative URLs to absolute
      if (url.startsWith('/')) {
        const baseUrlObj = new URL(baseUrl)
        url = `${baseUrlObj.protocol}//${baseUrlObj.host}${url}`
      } else if (!url.startsWith('http')) {
        url = new URL(url, currentUrl).href
      }
      
      const urlObj = new URL(url)
      
      // Check if domain is allowed
      const isAllowedDomain = allowedDomains.length === 0 || 
        allowedDomains.some(domain => urlObj.hostname.includes(domain)) ||
        urlObj.hostname === new URL(baseUrl).hostname
      
      if (isAllowedDomain && !url.includes('#') && !url.includes('?')) {
        links.push(url)
      }
    } catch (error) {
      // Invalid URL, skip
    }
  }
  
  return [...new Set(links)] // Remove duplicates
}

function extractDocuments(html: string, pageUrl: string): Array<{filename: string, url: string, type: string}> {
  const documents: Array<{filename: string, url: string, type: string}> = []
  
  // Common document extensions
  const docExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$/i
  
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
  
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]
    const linkText = match[2].replace(/<[^>]+>/g, '').trim()
    
    if (docExtensions.test(url)) {
      try {
        let fullUrl = url
        if (url.startsWith('/')) {
          const baseUrlObj = new URL(pageUrl)
          fullUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${url}`
        } else if (!url.startsWith('http')) {
          fullUrl = new URL(url, pageUrl).href
        }
        
        const filename = linkText || url.split('/').pop() || 'documento'
        const extension = url.match(docExtensions)?.[1]?.toLowerCase() || 'unknown'
        
        documents.push({
          filename: filename,
          url: fullUrl,
          type: extension
        })
      } catch (error) {
        // Invalid URL, skip
      }
    }
  }
  
  return documents
}
