#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SupabaseMCP } from 'supabase-mcp/supabase.js';

const server = new Server({
  name: 'supabase-mcp',
  version: '1.0.0',
});

// Supabase configuration
const supabaseConfig = {
  url: 'https://irghpvvoparqettcnpnh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo',
  options: {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
};

// Initialize Supabase MCP
const supabaseMCP = new SupabaseMCP(supabaseConfig);

// Register Supabase tools
server.setRequestHandler(supabaseMCP);

// Start the server
server.listen({
  onError: (error) => {
    console.error('MCP Server error:', error);
  },
  onClose: () => {
    console.log('MCP Server closed');
  },
});

console.log('Supabase MCP Server started');
console.log('Database URL:', supabaseConfig.url);
console.log('Available tools:', Object.keys(supabaseMCP.tools || {}));
