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
  const requestId = crypto.randomUUID().substring(0, 8)
  console.log(`=== INTELLIGENT SCRAPER EDGE FUNCTION START [${requestId}] ===`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log(`Method: ${req.method}`)
  console.log(`User-Agent: ${req.headers.get('user-agent') || 'Unknown'}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling CORS preflight request`)
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const scrapingBeeApiKey = Deno.env.get('SCRAPINGBEE_API_KEY')
    
    console.log(`[${requestId}] Environment check:`, {
      supabaseUrl: supabaseUrl ? `Set (${supabaseUrl.substring(0, 20)}...)` : 'MISSING',
      supabaseKey: supabaseKey ? `Set (${supabaseKey.length} chars)` : 'MISSING',
      scrapingBeeApiKey: scrapingBeeApiKey ? `Set (${scrapingBeeApiKey.length} chars)` : 'MISSING'
    })

    if (!supabaseUrl || !supabaseKey) {
      const missingVars = []
      if (!supabaseUrl) missingVars.push('SUPABASE_URL')
      if (!supabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
      
      console.error(`[${requestId}] Missing environment variables:`, missingVars)
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
    }

    if (!scrapingBeeApiKey) {
      console.error(`[${requestId}] ScrapingBee API key is missing`)
      throw new Error('ScrapingBee API key is required. Please configure SCRAPINGBEE_API_KEY in your Supabase secrets.')
    }

    // Test ScrapingBee API key validity
    try {
      console.log(`[${requestId}] Testing ScrapingBee API key...`)
      const testUrl = new URL('https://app.scrapingbee.com/api/v1/')
      testUrl.searchParams.append('api_key', scrapingBeeApiKey)
      testUrl.searchParams.append('url', 'https://httpbin.org/json')
      
      const testResponse = await fetch(testUrl.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (!testResponse.ok) {
        console.error(`[${requestId}] ScrapingBee API test failed:`, testResponse.status, testResponse.statusText)
        if (testResponse.status === 401) {
          throw new Error('Invalid ScrapingBee API key')
        }
        throw new Error(`ScrapingBee API test failed: ${testResponse.status}`)
      }
      console.log(`[${requestId}] ScrapingBee API key is valid`)
    } catch (apiTestError) {
      console.error(`[${requestId}] ScrapingBee API key test error:`, apiTestError)
      throw new Error(`ScrapingBee API key validation failed: ${apiTestError.message}`)
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
        scrapingBeeApiKey,
        {
          websiteId: website.id,
          baseUrl: website.base_url,
          maxPages: Math.min(website.max_pages || 25, 50),
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
          status: 202,
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

// Background scraping function using ScrapingBee
async function performBackgroundScraping(supabase: any, apiKey: string, job: ScrapingJob): Promise<void> {
  const startTime = Date.now()
  const jobId = crypto.randomUUID().substring(0, 8)
  console.log(`=== BACKGROUND SCRAPING STARTED [${jobId}] ===`)
  console.log(`Website ID: ${job.websiteId}`)
  console.log(`Base URL: ${job.baseUrl}`)
  console.log(`Max pages: ${job.maxPages}`)
  console.log(`Allowed domains: ${job.allowedDomains.join(', ') || 'All'}`)

  try {
    // Test database connection first
    console.log(`[${jobId}] Testing database connection...`)
    const { data: testData, error: testError } = await supabase
      .from('scraped_websites')
      .select('id, name')
      .eq('id', job.websiteId)
      .single()

    if (testError) {
      console.error(`[${jobId}] Database connection test failed:`, testError)
      throw new Error(`Database connection failed: ${testError.message}`)
    }
    console.log(`[${jobId}] Database connection successful. Website: "${testData.name}"`)

    // Perform the actual scraping using ScrapingBee with retry logic
    console.log(`[${jobId}] Starting ScrapingBee scraping...`)
    const scrapedPages = await scrapeWebsiteWithScrapingBeeRetry(apiKey, job, jobId)
    const scrapingDuration = Date.now() - startTime
    
    console.log(`=== SCRAPING COMPLETED [${jobId}] ===`)
    console.log(`Duration: ${scrapingDuration}ms`)
    console.log(`Pages found: ${scrapedPages.length}`)

    if (scrapedPages.length === 0) {
      console.warn(`[${jobId}] No pages were scraped! This might indicate an issue.`)
      // Still try to update the website timestamp
      await supabase
        .from('scraped_websites')
        .update({ 
          last_scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.websiteId)
      return
    }

    // Save scraped pages to database
    console.log(`=== SAVING TO DATABASE [${jobId}] ===`)
    let savedPagesCount = 0
    let savedDocumentsCount = 0
    let errorCount = 0

    // Process pages in smaller batches to avoid memory issues
    const BATCH_SIZE = 3
    for (let i = 0; i < scrapedPages.length; i += BATCH_SIZE) {
      const batch = scrapedPages.slice(i, i + BATCH_SIZE)
      
      for (const page of batch) {
        try {
          console.log(`[${jobId}] Processing page ${savedPagesCount + 1}/${scrapedPages.length}: ${page.url}`)

          // Simplified validation - more lenient
          if (!page.url || !page.url.startsWith('http')) {
            console.warn(`[${jobId}] Skipping invalid URL: ${page.url}`)
            errorCount++
            continue
          }

          if (!page.content || page.content.trim().length < 50) {
            console.warn(`[${jobId}] Skipping page with minimal content: ${page.url}`)
            errorCount++
            continue
          }

          // Clean and prepare data
          const cleanTitle = (page.title || 'Sin título').trim().substring(0, 500)
          const cleanContent = page.content.trim().substring(0, 50000)

          // Calculate content hash for deduplication
          const contentHash = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(cleanContent)
          )
          const hashArray = Array.from(new Uint8Array(contentHash))
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

          console.log(`[${jobId}] Saving page to database: ${page.url}`)

          // Insert or update page with detailed error handling
          const pageData = {
            website_id: job.websiteId,
            url: page.url,
            title: cleanTitle,
            content: cleanContent,
            content_hash: hashHex,
            page_type: page.page_type || 'html',
            status_code: page.status_code || 200,
            last_scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          console.log(`[${jobId}] Page data prepared:`, {
            url: pageData.url,
            title_length: pageData.title.length,
            content_length: pageData.content.length,
            website_id: pageData.website_id
          })

          const { data: savedPage, error: pageError } = await supabase
            .from('scraped_pages')
            .upsert(pageData, {
              onConflict: 'website_id,url'
            })
            .select()
            .single()

          if (pageError) {
            console.error(`[${jobId}] ERROR saving page ${page.url}:`, {
              error: pageError,
              pageData: {
                url: pageData.url,
                title: pageData.title,
                contentLength: pageData.content.length,
                websiteId: pageData.website_id
              }
            })
            errorCount++
            continue
          }

          if (!savedPage) {
            console.error(`[${jobId}] No page returned after upsert: ${page.url}`)
            errorCount++
            continue
          }

          savedPagesCount++
          console.log(`[${jobId}] ✓ Page saved successfully: ${page.url} (ID: ${savedPage.id})`)

          // Extract and save documents
          const documents = extractDocuments(page.content, page.url)
          console.log(`[${jobId}] Found ${documents.length} documents on page: ${page.url}`)
          
          for (const doc of documents.slice(0, 5)) {
            try {
              console.log(`[${jobId}] Saving document: ${doc.filename} (${doc.url})`)
              
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

              if (docError) {
                console.error(`[${jobId}] Error saving document: ${doc.filename}:`, docError)
              } else {
                savedDocumentsCount++
                console.log(`[${jobId}] ✓ Document saved: ${doc.filename}`)
              }
            } catch (docError) {
              console.error(`[${jobId}] Exception saving document ${doc.filename}:`, docError)
            }
          }

        } catch (pageError) {
          console.error(`[${jobId}] Exception processing page ${page.url}:`, pageError)
          errorCount++
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

    console.log(`=== BACKGROUND SCRAPING COMPLETED [${jobId}] ===`)
    console.log(`Pages saved: ${savedPagesCount}/${scrapedPages.length}`)
    console.log(`Documents found: ${savedDocumentsCount}`)
    console.log(`Errors encountered: ${errorCount}`)
    console.log(`Total duration: ${Date.now() - startTime}ms`)
    console.log(`Success rate: ${Math.round((savedPagesCount / scrapedPages.length) * 100)}%`)

  } catch (error) {
    console.error(`=== BACKGROUND SCRAPE FAILED [${jobId}] ===`)
    console.error('Error:', error)
    
    // Mark website as having an error
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

// Retry wrapper for ScrapingBee scraping
async function scrapeWebsiteWithScrapingBeeRetry(apiKey: string, job: ScrapingJob, jobId: string): Promise<ScrapedPage[]> {
  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${jobId}] Scraping attempt ${attempt}/${maxRetries}`)
      const result = await scrapeWebsiteWithScrapingBee(apiKey, job, jobId)
      
      if (result.length > 0) {
        console.log(`[${jobId}] Scraping successful on attempt ${attempt}`)
        return result
      } else if (attempt < maxRetries) {
        console.warn(`[${jobId}] No pages found on attempt ${attempt}, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds before retry
      }
    } catch (error) {
      lastError = error as Error
      console.error(`[${jobId}] Scraping attempt ${attempt} failed:`, error)
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 3000 // Exponential backoff: 6s, 12s
        console.log(`[${jobId}] Retrying in ${delay/1000} seconds...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  if (lastError) {
    throw new Error(`Scraping failed after ${maxRetries} attempts. Last error: ${lastError.message}`)
  }
  
  return [] // No pages found after all retries
}

// ScrapingBee implementation
async function scrapeWebsiteWithScrapingBee(apiKey: string, job: ScrapingJob, jobId: string): Promise<ScrapedPage[]> {
  const pages: ScrapedPage[] = []
  const visitedUrls = new Set<string>()
  const urlsToVisit = [job.baseUrl]

  console.log(`=== STARTING SCRAPINGBEE SCRAPING [${jobId}] ===`)
  console.log(`Base URL: ${job.baseUrl}`)
  console.log(`Max pages: ${job.maxPages}`)

  while (urlsToVisit.length > 0 && pages.length < job.maxPages) {
    const currentUrl = urlsToVisit.shift()!
    
    if (visitedUrls.has(currentUrl)) continue
    visitedUrls.add(currentUrl)

    try {
      console.log(`[${jobId}] Scraping page ${pages.length + 1}/${job.maxPages}: ${currentUrl}`)
      
      // ScrapingBee API call
      const scrapingBeeUrl = new URL('https://app.scrapingbee.com/api/v1/')
      scrapingBeeUrl.searchParams.append('api_key', apiKey)
      scrapingBeeUrl.searchParams.append('url', currentUrl)
      scrapingBeeUrl.searchParams.append('render_js', 'true') // Enable JavaScript rendering
      scrapingBeeUrl.searchParams.append('premium_proxy', 'true') // Better success rate
      scrapingBeeUrl.searchParams.append('country_code', 'es') // Spanish proxies

      const response = await fetch(scrapingBeeUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      })

      if (!response.ok) {
        console.error(`ScrapingBee error for ${currentUrl}: ${response.status}`)
        continue
      }

      const html = await response.text()
      
      if (html.length < 200) {
        console.warn(`Page too short: ${currentUrl}`)
        continue
      }

      const cleanedContent = extractTextContent(html)
      const title = extractTitle(html)

      // LOGS DETALLADOS PARA DEPURAR
      console.log(`[${jobId}] HTML length: ${html.length}`)
      console.log(`[${jobId}] Extracted text length: ${cleanedContent.length}`)
      console.log(`[${jobId}] Extracted text (first 300 chars): ${cleanedContent.substring(0, 300)}`)

      // BAJAR UMBRAL DE CONTENIDO MÍNIMO A 20 CARACTERES
      if (cleanedContent.length < 20) {
        console.warn(`Content too short: ${currentUrl}`)
        continue
      }

      pages.push({
        url: currentUrl,
        title,
        content: cleanedContent,
        status_code: response.status,
        page_type: 'html'
      })

      console.log(`✓ Scraped successfully: ${currentUrl}`)

      // Extract new URLs for next iteration (limited to avoid infinite loops)
      if (pages.length < job.maxPages - 5) {
        const newUrls = extractLinks(html, currentUrl, job.baseUrl, job.allowedDomains)
        const urlsToAdd = newUrls.slice(0, 3).filter(newUrl => 
          !visitedUrls.has(newUrl) && !urlsToVisit.includes(newUrl)
        )
        urlsToVisit.push(...urlsToAdd)
      }

      // Respectful delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error(`Error scraping ${currentUrl}:`, error)
    }
  }

  console.log(`=== SCRAPINGBEE SCRAPING SUMMARY ===`)
  console.log(`Total URLs visited: ${visitedUrls.size}`)
  console.log(`Pages with content: ${pages.length}`)

  return pages
}

// Helper functions remain the same
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
  
  return cleanLines.join('\n').substring(0, 10000)
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
      
      if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        continue
      }
      
      if (url.startsWith('/')) {
        const baseUrlObj = new URL(baseUrl)
        url = `${baseUrlObj.protocol}//${baseUrlObj.host}${url}`
      } else if (!url.startsWith('http')) {
        url = new URL(url, currentUrl).href
      }
      
      const urlObj = new URL(url)
      
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
  
  return [...new Set(links)]
}

function extractDocuments(html: string, pageUrl: string): Array<{filename: string, url: string, type: string}> {
  const documents: Array<{filename: string, url: string, type: string}> = []
  
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
