export interface CrawlRow {
  id: string;
  domain: string;
  start_url: string;
  mode: 'local' | 'apify';
  status: 'pending' | 'processing' | 'completed' | 'error';
  apify_run_id?: string | null;
  stats?: any;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  crawl_id: string;
  url: string;
  title?: string | null;
  doc_type: 'html' | 'pdf';
  storage_path: string;
  content?: string | null;
  metadata?: any;
  created_at: string;
}


