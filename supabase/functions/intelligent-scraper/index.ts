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
  console.log(`=== EDGE FUNCTION START ===`)
  console.log(`Method: ${req.method}`)
  console.log(`URL: ${req.url}`)
  console.log(`Headers:`, Object.fromEntries(req.headers.entries()))
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? `Set (${supabaseUrl.substring(0, 20)}...)` : 'Missing',
      supabaseKey: supabaseKey ? `Set (${supabaseKey.substring(0, 10)}...)` : 'Missing'
    })

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables')
    }

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
      console.log('Request body parsed:', JSON.stringify(requestBody, null, 2))
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      throw new Error('Invalid JSON in request body')
    }

    const { websiteId, action = 'scrape' } = requestBody

    if (!websiteId) {
      throw new Error('websiteId is required')
    }

    console.log(`Processing action: ${action} for website: ${websiteId}`)

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (action === 'scrape') {
      console.log(`=== STARTING SCRAPING PROCESS ===`)
      console.log(`Website ID: ${websiteId}`)

      // Get website configuration
      console.log('Fetching website configuration...')
      const { data: website, error: websiteError } = await supabase
        .from('scraped_websites')
        .select('*')
        .eq('id', websiteId)
        .single()

      if (websiteError) {
        console.error('Website fetch error:', websiteError)
        throw new Error(`Website not found: ${websiteError.message}`)
      }

      if (!website) {
        console.error('Website not found in database')
        throw new Error('Website not found')
      }

      console.log(`Website found: ${website.name} - ${website.base_url}`)
      console.log(`Configuration: maxPages=${website.max_pages}, domains=${JSON.stringify(website.allowed_domains)}`)

      // Start scraping process
      console.log('=== STARTING WEB SCRAPING ===')
      const scrapedPages = await scrapeWebsite({
        websiteId: website.id,
        baseUrl: website.base_url,
        maxPages: Math.min(website.max_pages || 50, 100),
        allowedDomains: website.allowed_domains || []
      })

      console.log(`=== SCRAPING COMPLETED ===`)
      console.log(`Total pages scraped: ${scrapedPages.length}`)

      // Save scraped pages to database
      console.log('=== SAVING TO DATABASE ===')
      let savedPagesCount = 0
      let savedDocumentsCount = 0

      for (const [index, page] of scrapedPages.entries()) {
        try {
          console.log(`Processing page ${index + 1}/${scrapedPages.length}: ${page.url}`)

          // Calculate content hash for deduplication
          const contentHash = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(page.content || '')
          )
          const hashArray = Array.from(new Uint8Array(contentHash))
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

          console.log(`Content hash calculated: ${hashHex.substring(0, 16)}...`)

          // Check if page already exists with same content
          const { data: existingPage } = await supabase
            .from('scraped_pages')
            .select('id')
            .eq('website_id', websiteId)
            .eq('url', page.url)
            .eq('content_hash', hashHex)
            .maybeSingle()

          if (existingPage) {
            console.log(`Page already exists with same content: ${page.url}`)
            continue
          }

          // Insert or update page
          console.log(`Saving page to database: ${page.title}`)
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
            continue
          }

          savedPagesCount++
          console.log(`Successfully saved page: ${page.url}`)

          // Extract and save documents from the page
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
                console.log(`Successfully saved document: ${doc.filename}`)
              } else {
                console.error(`Error saving document ${doc.filename}:`, docError)
              }
            } catch (docError) {
              console.error(`Exception saving document ${doc.filename}:`, docError)
            }
          }
        } catch (error) {
          console.error(`Error processing page ${page.url}:`, error)
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
      } else {
        console.log('Website timestamp updated successfully')
      }

      console.log(`=== FINAL RESULTS ===`)
      console.log(`Pages saved: ${savedPagesCount}`)
      console.log(`Documents found: ${savedDocumentsCount}`)
      console.log(`Total pages processed: ${scrapedPages.length}`)

      return new Response(
        JSON.stringify({
          success: true,
          message: `Scraping completed successfully`,
          stats: {
            pages_scraped: savedPagesCount,
            documents_found: savedDocumentsCount,
            total_pages_found: scrapedPages.length
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )

  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error',
        details: error.stack,
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
  const fetchWithTimeout = async (url: string, timeout = 15000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      console.log(`Fetching URL: ${url}`)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Municipal-Assistant-Bot/1.0 (+https://lovable.dev)'
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      console.log(`Response received: ${response.status} ${response.statusText}`)
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
      
      const response = await fetchWithTimeout(currentUrl, 15000)

      if (!response.ok) {
        console.log(`Failed to fetch ${currentUrl}: ${response.status} ${response.statusText}`)
        continue
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) {
        console.log(`Skipping non-HTML content: ${currentUrl} (${contentType})`)
        continue
      }

      const html = await response.text()
      console.log(`HTML received: ${html.length} characters`)
      
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

      // Add delay to be respectful
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
