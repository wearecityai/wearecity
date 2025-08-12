import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type Crawl = {
  id: string;
  start_url: string;
  domain: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  mode: 'local' | 'apify';
  stats: { pagesCrawled?: number; pdfsDownloaded?: number; docsIndexed?: number; errorsCount?: number } | null;
  created_at: string;
  updated_at: string;
  error_message?: string | null;
};

export default function CrawlManager() {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'local' | 'apify'>('apify');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Crawl[]>([]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('crawls').select('*').order('created_at', { ascending: false }).limit(20);
    setRows(data as Crawl[] ?? []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel('crawls-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crawls' }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

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
      setUrl('');
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [mode, refresh, url]);

  const renderStatus = useCallback((row: Crawl) => {
    const s = row.stats || {};
    return `${row.status} · pages:${s.pagesCrawled ?? 0} · pdfs:${s.pdfsDownloaded ?? 0} · docs:${s.docsIndexed ?? 0} · err:${s.errorsCount ?? 0}`;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Input placeholder="https://www.ayuntamiento.es" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Select value={mode} onValueChange={(v) => setMode(v as any)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Modo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="apify">Apify</SelectItem>
            <SelectItem value="local">Local</SelectItem>
          </SelectContent>
        </Select>
        <Button disabled={loading || !url} onClick={start}>Iniciar</Button>
      </div>
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.id} className="rounded border p-3">
            <div className="text-sm font-medium">{r.domain}</div>
            <div className="text-xs text-muted-foreground break-all">{r.start_url}</div>
            <div className="text-xs mt-1">{renderStatus(r)}</div>
            {r.status === 'error' && r.error_message && (
              <div className="text-xs text-red-600 mt-1">{r.error_message}</div>
            )}
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        En modo Local, ejecuta el script con el `crawl_id` creado para procesar: bun run crawl:local -- --start https://... --crawl-id &lt;id&gt;
      </div>
    </div>
  );
}


