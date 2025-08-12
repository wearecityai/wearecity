import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';

type CrawlStatus = 'pending' | 'processing' | 'completed' | 'error';

type CrawlRow = {
  id: string;
  start_url: string;
  domain: string;
  status: CrawlStatus;
  mode: 'local' | 'apify';
  stats: { pagesCrawled?: number; pdfsDownloaded?: number; docsIndexed?: number; errorsCount?: number } | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
};

interface Props {
  startUrl?: string;
}

const AyuntamientoCrawlerInline: React.FC<Props> = ({ startUrl = '' }) => {
  const [url, setUrl] = useState(startUrl);
  const [mode, setMode] = useState<'local' | 'apify'>('apify');
  const [loading, setLoading] = useState(false);
  const [crawl, setCrawl] = useState<CrawlRow | null>(null);

  useEffect(() => {
    setUrl(startUrl || '');
  }, [startUrl]);

  const progressValue = useMemo(() => {
    if (!crawl) return 0;
    if (crawl.status === 'completed') return 100;
    if (crawl.status === 'error') return 100;
    // If processing without totals, show pseudo-progress based on docsIndexed
    const s = crawl.stats || {};
    const completed = (s.docsIndexed || 0) + (s.pagesCrawled || 0) + (s.pdfsDownloaded || 0);
    // Cap to 95% while processing
    return Math.min(95, completed % 96);
  }, [crawl]);

  const start = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch('/functions/v1/crawl-manager', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ start_url: url, mode })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const id = data.id as string;

      // Load initial row
      const { data: row } = await supabase.from('crawls').select('*').eq('id', id).single();
      if (row) setCrawl(row as CrawlRow);

      // Subscribe for updates
      const channel = supabase
        .channel(`crawls-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'crawls', filter: `id=eq.${id}` }, (payload) => {
          if (payload.new) setCrawl(payload.new as CrawlRow);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [mode, url]);

  const copyLocalCommand = useCallback(() => {
    if (!crawl) return;
    const cmd = `SUPABASE_URL=YOUR_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY GOOGLE_API_KEY=YOUR_GEMINI_KEY npm run crawl:local -- --start ${crawl.start_url} --crawl-id ${crawl.id}`;
    navigator.clipboard.writeText(cmd);
  }, [crawl]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <Input placeholder="https://www.ayuntamiento.ejemplo.es" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Select value={mode} onValueChange={(v) => setMode(v as any)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Modo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="apify">Apify</SelectItem>
            <SelectItem value="local">Local</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={start} disabled={loading || !url}>{loading ? 'Iniciando…' : 'Indexar'}</Button>
      </div>

      {crawl && (
        <div className="space-y-1 rounded border p-3">
          <div className="text-xs text-muted-foreground break-all">{crawl.start_url}</div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">Estado: {crawl.status}</div>
            <div className="text-xs">docs: {crawl.stats?.docsIndexed ?? 0} · pages: {crawl.stats?.pagesCrawled ?? 0} · pdfs: {crawl.stats?.pdfsDownloaded ?? 0} · err: {crawl.stats?.errorsCount ?? 0}</div>
          </div>
          <Progress value={progressValue} />
          {crawl.status === 'error' && crawl.error_message && (
            <div className="text-xs text-red-600 mt-1">{crawl.error_message}</div>
          )}
          {crawl.mode === 'local' && crawl.status !== 'completed' && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={copyLocalCommand}>Copiar comando local</Button>
              <div className="text-[10px] text-muted-foreground">
                Ejecuta el comando en tu terminal para procesar y subir automáticamente a Supabase.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AyuntamientoCrawlerInline;


