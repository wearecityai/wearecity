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
  console.log(`Request received: ${req.method} ${req.url}`)
  
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
      supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
      supabaseKey: supabaseKey ? 'Set' : 'Missing'
    })

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables')
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    const requestBody = await req.json()
    console.log('Request body received:', requestBody)

    const { websiteId, action = 'scrape' } = requestBody

    if (!websiteId) {
      throw new Error('websiteId is required')
    }

    if (action === 'scrape') {
      console.log(`Starting scraping for website: ${websiteId}`)

      // Get website configuration with timeout
      const websitePromise = supabase
        .from('scraped_websites')
        .select('*')
        .eq('id', websiteId)
        .single()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )

      const { data: website, error: websiteError } = await Promise.race([
        websitePromise,
        timeoutPromise
      ]) as any

      if (websiteError || !website) {
        console.error('Website fetch error:', websiteError)
        throw new Error(`Website not found: ${websiteError?.message || 'Unknown error'}`)
      }

      console.log(`Scraping website: ${website.name} - ${website.base_url}`)

      // Start scraping process with timeout
      const scrapingPromise = scrapeWebsite({
        websiteId: website.id,
        baseUrl: website.base_url,
        maxPages: Math.min(website.max_pages || 50, 100), // Limit to 100 pages max
        allowedDomains: website.allowed_domains || []
      })

      const scrapingTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Scraping timeout after 5 minutes')), 300000)
      )

      const scrapedPages = await Promise.race([
        scrapingPromise,
        scrapingTimeoutPromise
      ]) as ScrapedPage[]

      console.log(`Scraping completed, processing ${scrapedPages.length} pages`)

      // Save scraped pages to database
      let savedPagesCount = 0
      let savedDocumentsCount = 0

      for (const page of scrapedPages) {
        try {
          // Calculate content hash for deduplication
          const contentHash = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(page.content || '')
          )
          const hashArray = Array.from(new Uint8Array(contentHash))
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

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
          console.log(`Saved page: ${page.url}`)

          // Extract and save documents from the page
          const documents = extractDocuments(page.content, page.url)
          for (const doc of documents) {
            try {
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
                console.log(`Saved document reference: ${doc.filename}`)
              }
            } catch (docError) {
              console.error(`Error saving document ${doc.filename}:`, docError)
            }
          }
        } catch (error) {
          console.error(`Error processing page ${page.url}:`, error)
        }
      }

      // Update website's last_scraped_at timestamp
      const { error: updateError } = await supabase
        .from('scraped_websites')
        .update({ 
          last_scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', websiteId)

      if (updateError) {
        console.error('Error updating website timestamp:', updateError)
      }

      console.log(`Scraping completed: ${savedPagesCount} pages, ${savedDocumentsCount} documents`)

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
    console.error('Scraping error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
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

  console.log(`Starting to scrape ${job.baseUrl} with max ${job.maxPages} pages`)

  // Add timeout for individual page requests
  const fetchWithTimeout = async (url: string, timeout = 10000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Municipal-Assistant-Bot/1.0 (+https://lovable.dev)'
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  while (urlsToVisit.length > 0 && pages.length < job.maxPages) {
    const currentUrl = urlsToVisit.shift()!
    
    if (visitedUrls.has(currentUrl)) {
      continue
    }

    visitedUrls.add(currentUrl)

    try {
      console.log(`Scraping: ${currentUrl}`)
      
      const response = await fetchWithTimeout(currentUrl, 15000)

      if (!response.ok) {
        console.log(`Failed to fetch ${currentUrl}: ${response.status}`)
        continue
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) {
        console.log(`Skipping non-HTML content: ${currentUrl}`)
        continue
      }

      const html = await response.text()
      const cleanedContent = extractTextContent(html)
      const title = extractTitle(html)

      // Only save pages with meaningful content
      if (cleanedContent.length > 100) {
        pages.push({
          url: currentUrl,
          title: title,
          content: cleanedContent,
          status_code: response.status,
          page_type: 'html'
        })

        console.log(`Added page: ${title} (${cleanedContent.length} chars)`)
      }

      // Extract new URLs to visit (limit to prevent infinite loops)
      if (pages.length < job.maxPages) {
        const newUrls = extractLinks(html, currentUrl, job.baseUrl, job.allowedDomains)
        const urlsToAdd = newUrls.slice(0, 10) // Limit new URLs per page
        
        for (const newUrl of urlsToAdd) {
          if (!visitedUrls.has(newUrl) && !urlsToVisit.includes(newUrl)) {
            urlsToVisit.push(newUrl)
          }
        }
      }

      // Add delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.error(`Error scraping ${currentUrl}:`, error)
      // Continue with next URL instead of failing completely
    }
  }

  console.log(`Scraping completed: ${pages.length} pages found`)
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
