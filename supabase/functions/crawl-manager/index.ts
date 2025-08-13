// Deno Edge Function: Crawl Manager
// - POST: start a crawl (mode: 'local' | 'apify')
// - GET: get crawl status by id

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface StartPayload {
  start_url: string;
  mode?: 'local' | 'apify';
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN');
const APIFY_ACTOR_ID = Deno.env.get('APIFY_ACTOR_ID');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function parseDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url;
  }
}

async function startApifyRun(crawlId: string, startUrl: string) {
  if (!APIFY_TOKEN || !APIFY_ACTOR_ID) {
    throw new Error('APIFY_TOKEN or APIFY_ACTOR_ID not configured');
  }
  const input = {
    startUrl,
    crawlId,
    supabaseUrl: SUPABASE_URL,
    supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    storageBucket: 'ayuntamientos'
  };
  const res = await fetch(`https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_TOKEN}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      input,
      build: 'latest',
      // Webhook to mark completion (optional):
      // webhooks: [{
      //   eventTypes: ['ACTOR.RUN.SUCCEEDED','ACTOR.RUN.FAILED'],
      //   requestUrl: `${SUPABASE_URL}/functions/v1/crawl-manager?crawl_id=${crawlId}`
      // }]
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to start Apify actor: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data?.data?.id as string | undefined;
}

async function handleStart(req: Request): Promise<Response> {
  const payload = (await req.json()) as StartPayload;
  const { start_url, mode = 'apify' } = payload;
  if (!start_url) return new Response('Missing start_url', { status: 400 });
  const domain = parseDomain(start_url);

  const { data: crawl, error } = await supabase
    .from('crawls')
    .insert({
      domain,
      start_url,
      mode,
      status: 'pending'
    })
    .select('*')
    .single();
  if (error || !crawl) {
    return new Response(`DB insert error: ${error?.message}`, { status: 500 });
  }

  try {
    if (mode === 'apify') {
      const runId = await startApifyRun(crawl.id, start_url);
      await supabase.from('crawls').update({ status: 'processing', apify_run_id: runId ?? null })
        .eq('id', crawl.id);
    } else {
      // Local mode: just mark as processing; developer will run the local script with crawl_id
      await supabase.from('crawls').update({ status: 'processing' }).eq('id', crawl.id);
    }
    return new Response(JSON.stringify({ id: crawl.id }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from('crawls').update({ status: 'error', error_message: message }).eq('id', crawl.id);
    return new Response(`Failed to start crawl: ${message}`, { status: 500 });
  }
}

async function handleGet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const { data, error } = await supabase.from('crawls').select('*').eq('id', id).single();
  if (error || !data) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
}

serve(async (req: Request) => {
  if (req.method === 'POST') return handleStart(req);
  if (req.method === 'GET') return handleGet(req);
  return new Response('Method not allowed', { status: 405 });
});


