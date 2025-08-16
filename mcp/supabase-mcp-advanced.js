#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SupabaseMCP } from 'supabase-mcp/supabase.js';

const server = new Server({
  name: 'city-chat-supabase-mcp',
  version: '1.0.0',
  capabilities: {
    tools: {
      listChanged: true,
    },
  },
});

// Supabase configuration from your project
const supabaseConfig = {
  url: 'https://irghpvvoparqettcnpnh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo',
  options: {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public'
    }
  }
};

// Initialize Supabase MCP with enhanced configuration
const supabaseMCP = new SupabaseMCP({
  ...supabaseConfig,
  // Enable all available tools
  enableAllTools: true,
  // Custom table configurations for your city chat app
  tables: {
    cities: {
      description: 'Cities table with location and metadata',
      operations: ['select', 'insert', 'update', 'delete']
    },
    conversations: {
      description: 'Chat conversations for each city',
      operations: ['select', 'insert', 'update', 'delete']
    },
    messages: {
      description: 'Individual chat messages',
      operations: ['select', 'insert', 'update', 'delete']
    },
    crawls_documents: {
      description: 'Crawled documents from city websites',
      operations: ['select', 'insert', 'update', 'delete']
    }
  }
});

// Register Supabase tools
server.setRequestHandler(supabaseMCP);

// Enhanced error handling
server.on('error', (error) => {
  console.error('MCP Server error:', error);
});

// Log available tools on startup
server.on('listTools', () => {
  console.log('Available Supabase MCP tools:');
  if (supabaseMCP.tools) {
    Object.keys(supabaseMCP.tools).forEach(toolName => {
      console.log(`  - ${toolName}`);
    });
  }
});

// Start the server
server.listen({
  onError: (error) => {
    console.error('Failed to start MCP Server:', error);
    process.exit(1);
  },
  onClose: () => {
    console.log('MCP Server closed gracefully');
  },
});

console.log('🚀 City Chat Supabase MCP Server started');
console.log(`📊 Database: ${supabaseConfig.url}`);
console.log('🔧 Available operations: CRUD on cities, conversations, messages, and documents');
console.log('📝 Use this server with MCP-compatible AI assistants to interact with your database');
