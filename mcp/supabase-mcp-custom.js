#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration from your project
const supabaseConfig = {
  url: 'https://irghpvvoparqettcnpnh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo',
};

// Initialize Supabase client
const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

// Create MCP server
const server = new Server({
  name: 'city-chat-supabase-mcp',
  version: '1.0.0',
});

// Define available tools
const tools = [
  {
    name: 'query_cities',
    description: 'Query cities from the database with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        select: {
          type: 'string',
          description: 'Columns to select (default: *)',
          default: '*'
        },
        filters: {
          type: 'object',
          description: 'Optional filters to apply'
        }
      }
    }
  },
  {
    name: 'query_conversations',
    description: 'Query conversations from the database',
    inputSchema: {
      type: 'object',
      properties: {
        city_id: {
          type: 'string',
          description: 'Filter by city ID'
        },
        select: {
          type: 'string',
          description: 'Columns to select (default: *)',
          default: '*'
        }
      }
    }
  },
  {
    name: 'query_messages',
    description: 'Query chat messages from the database',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: {
          type: 'string',
          description: 'Filter by conversation ID'
        },
        select: {
          type: 'string',
          description: 'Columns to select (default: *)',
          default: '*'
        }
      }
    }
  },
  {
    name: 'insert_city',
    description: 'Insert a new city into the database',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'City name'
        },
        country: {
          type: 'string',
          description: 'Country name'
        },
        coordinates: {
          type: 'object',
          description: 'City coordinates {lat, lng}'
        }
      },
      required: ['name', 'country']
    }
  },
  {
    name: 'list_tables',
    description: 'List all available tables in the database',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Tool implementations
const toolImplementations = {
  async query_cities({ select = '*', filters = {} }) {
    try {
      let query = supabase.from('cities').select(select);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${data.length} cities:\n${JSON.stringify(data, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error querying cities: ${error.message}`
          }
        ]
      };
    }
  },

  async query_conversations({ city_id, select = '*' }) {
    try {
      let query = supabase.from('conversations').select(select);
      
      if (city_id) {
        query = query.eq('city_id', city_id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${data.length} conversations:\n${JSON.stringify(data, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error querying conversations: ${error.message}`
          }
        ]
      };
    }
  },

  async query_messages({ conversation_id, select = '*' }) {
    try {
      let query = supabase.from('messages').select(select);
      
      if (conversation_id) {
        query = query.eq('conversation_id', conversation_id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${data.length} messages:\n${JSON.stringify(data, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error querying messages: ${error.message}`
          }
        ]
      };
    }
  },

  async insert_city({ name, country, coordinates }) {
    try {
      const cityData = {
        name,
        country,
        ...(coordinates && { coordinates })
      };
      
      const { data, error } = await supabase
        .from('cities')
        .insert(cityData)
        .select();
      
      if (error) throw error;
      
      return {
        content: [
          {
            type: 'text',
            text: `City inserted successfully:\n${JSON.stringify(data[0], null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error inserting city: ${error.message}`
          }
        ]
      };
    }
  },

  async list_tables() {
    try {
      // This is a simplified version - in practice you might want to query information_schema
      const tables = ['cities', 'conversations', 'messages', 'crawls_documents'];
      
      return {
        content: [
          {
            type: 'text',
            text: `Available tables:\n${tables.join('\n')}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing tables: ${error.message}`
          }
        ]
      };
    }
  }
};

// Set up tool handling
server.setRequestHandler({
  async listTools() {
    return { tools };
  },
  
  async callTool({ name, arguments: args }) {
    const tool = toolImplementations[name];
    
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    return await tool(args);
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
console.log('🔧 Available tools:', tools.map(t => t.name).join(', '));
console.log('📝 Use this server with MCP-compatible AI assistants to interact with your database');


