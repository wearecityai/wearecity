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
  console.log(`URL: ${req.url}`)
  console.log(`Headers:`, Object.fromEntries(req.headers.entries()))
  
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
      supabaseUrl: supabaseUrl ? `Set (${supabaseUrl.substring(0, 30)}...)` : 'MISSING',
      supabaseKey: supabaseKey ? `Set (${supabaseKey.substring(0, 20)}...)` : 'MISSING',
      hasAllKeys: !!(supabaseUrl && supabaseKey)
    })

    if (!supabaseUrl || !supabaseKey) {
      const missingVars = []
      if (!supabaseUrl) missingVars.push('SUPABASE_URL')
      if (!supabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
      
      console.error('Missing environment variables:', missingVars)
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
    }

    // Parse request body with better error handling
    let requestBody
    try {
      const rawBody = await req.text()
      console.log('Raw request body:', rawBody)
      
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Request body is empty')
      }
      
      requestBody = JSON.parse(rawBody)
      console.log('Parsed request body:', JSON.stringify(requestBody, null, 2))
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      console.error('Parse error details:', {
        name: parseError.name,
        message: parseError.message,
        stack: parseError.stack
      })
      throw new Error(`Invalid JSON in request body: ${parseError.message}`)
    }

    const { websiteId, action = 'scrape' } = requestBody

    if (!websiteId) {
      console.error('Missing websiteId in request')
      throw new Error('websiteId is required')
    }

    console.log(`Processing action: ${action} for website: ${websiteId}`)

    // Create Supabase client with error handling
    let supabase
    try {
      supabase = createClient(supabaseUrl, supabaseKey)
      console.log('Supabase client created successfully')
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError)
      throw new Error(`Failed to initialize database connection: ${clientError.message}`)
    }

    if (action === 'scrape') {
      console.log(`=== STARTING SCRAPING PROCESS ===`)
      console.log(`Website ID: ${websiteId}`)
      console.log(`Process start time: ${new Date().toISOString()}`)

      // Get website configuration with better error handling
      console.log('Fetching website configuration from database...')
      const { data: website, error: websiteError } = await supabase
        .from('scraped_websites')
        .select('*')
        .eq('id', websiteId)
        .single()

      if (websiteError) {
        console.error('Database error fetching website:', websiteError)
        console.error('Error details:', {
          code: websiteError.code,
          message: websiteError.message,
          details: websiteError.details,
          hint: websiteError.hint
        })
        throw new Error(`Website not found in database: ${websiteError.message}`)
      }

      if (!website) {
        console.error('Website not found: query returned null')
        throw new Error(`Website with ID ${websiteId} not found`)
      }

      console.log(`Website configuration loaded:`)
      console.log(`- Name: ${website.name}`)
      console.log(`- URL: ${website.base_url}`)
      console.log(`- Max pages: ${website.max_pages}`)
      console.log(`- Allowed domains: ${JSON.stringify(website.allowed_domains)}`)
      console.log(`- Is active: ${website.is_active}`)

      if (!website.is_active) {
        console.warn('Website is marked as inactive')
        throw new Error('Website is currently inactive')
      }

      // Validate website URL
      try {
        new URL(website.base_url)
        console.log('Website URL validated successfully')
      } catch (urlError) {
        console.error('Invalid website URL:', website.base_url, urlError)
        throw new Error(`Invalid website URL: ${website.base_url}`)
      }

      // Start scraping process with timeout
      console.log('=== STARTING WEB SCRAPING ===')
      const scrapingStartTime = Date.now()
      
      let scrapedPages: ScrapedPage[] = []
      try {
        scrapedPages = await scrapeWebsite({
          websiteId: website.id,
          baseUrl: website.base_url,
          maxPages: Math.min(website.max_pages || 50, 100), // Cap at 100 pages
          allowedDomains: website.allowed_domains || []
        })
        
        const scrapingDuration = Date.now() - scrapingStartTime
        console.log(`=== SCRAPING COMPLETED ===`)
        console.log(`Duration: ${scrapingDuration}ms`)
        console.log(`Pages found: ${scrapedPages.length}`)
      } catch (scrapingError) {
        console.error('Scraping failed:', scrapingError)
        throw new Error(`Scraping failed: ${scrapingError.message}`)
      }

      // Save scraped pages to database
      console.log('=== SAVING TO DATABASE ===')
      let savedPagesCount = 0
      let savedDocumentsCount = 0
      let processingErrors: string[] = []

      for (const [index, page] of scrapedPages.entries()) {
        try {
          console.log(`Processing page ${index + 1}/${scrapedPages.length}: ${page.url}`)

          // Validate page data
          if (!page.url || !page.title || !page.content) {
            console.warn(`Skipping invalid page data:`, {
              hasUrl: !!page.url,
              hasTitle: !!page.title,
              hasContent: !!page.content,
              contentLength: page.content?.length || 0
            })
            continue
          }

          // Calculate content hash for deduplication
          const contentHash = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(page.content || '')
          )
          const hashArray = Array.from(new Uint8Array(contentHash))
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

          console.log(`Content hash: ${hashHex.substring(0, 16)}...`)

          // Check if page already exists with same content
          const { data: existingPage, error: checkError } = await supabase
            .from('scraped_pages')
            .select('id')
            .eq('website_id', websiteId)
            .eq('url', page.url)
            .eq('content_hash', hashHex)
            .maybeSingle()

          if (checkError) {
            console.error(`Error checking existing page: ${checkError.message}`)
            processingErrors.push(`Check error for ${page.url}: ${checkError.message}`)
            continue
          }

          if (existingPage) {
            console.log(`Page already exists with same content: ${page.url}`)
            continue
          }

          // Insert or update page
          console.log(`Saving page: ${page.title}`)
          const { data: savedPage, error: pageError } = await supabase
            .from('scraped_pages')
            .upsert({
              website_id: websiteId,
              url: page.url,
              title: page.title,
              content: page.content,
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
          console.log(`✓ Page saved successfully: ${page.url}`)

          // Extract and save documents from the page
          try {
            const documents = extractDocuments(page.content, page.url)
            console.log(`Found ${documents.length} documents in page`)
            
            for (const doc of documents) {
              try {
                console.log(`Saving document: ${doc.filename}`)
                const { error: docError } = await supabase
                  .from('scraped_documents')
                  .upsert({
                    page_id: savedPage.id,
                    filename: doc.filename,
                    file_url: doc.url,
                    file_type: doc.type,
                    download_status: 'pending'
                  }, {
                    onConflict: 'page_id,file_url'
                  })

                if (!docError) {
                  savedDocumentsCount++
                  console.log(`✓ Document saved: ${doc.filename}`)
                } else {
                  console.error(`Error saving document ${doc.filename}:`, docError)
                  processingErrors.push(`Document save error: ${docError.message}`)
                }
              } catch (docError) {
                console.error(`Exception saving document ${doc.filename}:`, docError)
                processingErrors.push(`Document exception: ${docError.message}`)
              }
            }
          } catch (docExtractionError) {
            console.error(`Error extracting documents from ${page.url}:`, docExtractionError)
            processingErrors.push(`Document extraction error: ${docExtractionError.message}`)
          }
        } catch (pageError) {
          console.error(`Error processing page ${page.url}:`, pageError)
          processingErrors.push(`Page processing error: ${pageError.message}`)
        }
      }

      // Update website's last_scraped_at timestamp
      console.log('Updating website last_scraped_at timestamp...')
      const { error: updateError } = await supabase
        .from('scraped_websites')
        .update({ 
          last_scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', websiteId)

      if (updateError) {
        console.error('Error updating website timestamp:', updateError)
        processingErrors.push(`Timestamp update error: ${updateError.message}`)
      } else {
        console.log('✓ Website timestamp updated successfully')
      }

      console.log(`=== FINAL RESULTS ===`)
      console.log(`Pages saved: ${savedPagesCount}`)
      console.log(`Documents found: ${savedDocumentsCount}`)
      console.log(`Total pages processed: ${scrapedPages.length}`)
      console.log(`Processing errors: ${processingErrors.length}`)
      
      if (processingErrors.length > 0) {
        console.log('Processing errors details:', processingErrors)
      }

      const resultStats = {
        pages_scraped: savedPagesCount,
        documents_found: savedDocumentsCount,
        total_pages_found: scrapedPages.length,
        processing_errors: processingErrors.length
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Scraping completed successfully. Saved ${savedPagesCount} pages and found ${savedDocumentsCount} documents.`,
          stats: resultStats,
          errors: processingErrors.length > 0 ? processingErrors : undefined
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
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
    console.error('Error timestamp:', new Date().toISOString())
    console.error('Error type:', typeof error)
    console.error('Error instanceof Error:', error instanceof Error)
    console.error('Error details:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      console.error('Error name:', error.name)
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function scrapeWebsite(job: ScrapingJob): Promise<ScrapedPage[]> {
  const pages: ScrapedPage[] = []
  const visitedUrls = new Set<string>()
  const urlsToVisit = [job.baseUrl]

  console.log(`=== STARTING WEBSITE SCRAPING ===`)
  console.log(`Base URL: ${job.baseUrl}`)
  console.log(`Max pages: ${job.maxPages}`)
  console.log(`Allowed domains: ${JSON.stringify(job.allowedDomains)}`)

  // Add timeout for individual page requests
  const fetchWithTimeout = async (url: string, timeout = 30000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log(`Timeout reached for ${url}`)
      controller.abort()
    }, timeout)
    
    try {
      console.log(`Fetching URL: ${url}`)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Municipal-Assistant-Bot/1.0 (+https://lovable.dev)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      console.log(`Response: ${response.status} ${response.statusText} (${url})`)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`Fetch error for ${url}:`, error.message)
      throw error
    }
  }

  while (urlsToVisit.length > 0 && pages.length < job.maxPages) {
    const currentUrl = urlsToVisit.shift()!
    
    if (visitedUrls.has(currentUrl)) {
      console.log(`Skipping already visited URL: ${currentUrl}`)
      continue
    }

    visitedUrls.add(currentUrl)

    try {
      console.log(`Processing URL ${visitedUrls.size}/${Math.min(job.maxPages, urlsToVisit.length + visitedUrls.size)}: ${currentUrl}`)
      
      const response = await fetchWithTimeout(currentUrl, 30000)

      if (!response.ok) {
        console.log(`HTTP error ${response.status} for ${currentUrl}: ${response.statusText}`)
        continue
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) {
        console.log(`Skipping non-HTML content: ${currentUrl} (${contentType})`)
        continue
      }

      const html = await response.text()
      console.log(`HTML received: ${html.length} characters`)
      
      if (html.length < 100) {
        console.log(`Skipping page with minimal content: ${currentUrl}`)
        continue
      }

      const cleanedContent = extractTextContent(html)
      const title = extractTitle(html)

      console.log(`Extracted: title="${title}", content=${cleanedContent.length} chars`)

      // Only save pages with meaningful content
      if (cleanedContent.length > 100) {
        pages.push({
          url: currentUrl,
          title: title,
          content: cleanedContent,
          status_code: response.status,
          page_type: 'html'
        })

        console.log(`✓ Added page ${pages.length}: ${title}`)
      } else {
        console.log(`✗ Skipped page (content too short): ${title}`)
      }

      // Extract new URLs to visit (limit to prevent infinite loops)
      if (pages.length < job.maxPages) {
        const newUrls = extractLinks(html, currentUrl, job.baseUrl, job.allowedDomains)
        const urlsToAdd = newUrls.slice(0, 5) // Limit new URLs per page
        
        console.log(`Found ${newUrls.length} links, adding ${urlsToAdd.length}`)
        
        for (const newUrl of urlsToAdd) {
          if (!visitedUrls.has(newUrl) && !urlsToVisit.includes(newUrl)) {
            urlsToVisit.push(newUrl)
            console.log(`  → Queued: ${newUrl}`)
          }
        }
      }

      // Add delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error(`Error scraping ${currentUrl}:`, error.message)
      // Continue with next URL instead of failing completely
    }
  }

  console.log(`=== SCRAPING SUMMARY ===`)
  console.log(`Total URLs visited: ${visitedUrls.size}`)
  console.log(`Pages with content: ${pages.length}`)
  console.log(`URLs remaining in queue: ${urlsToVisit.length}`)

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
