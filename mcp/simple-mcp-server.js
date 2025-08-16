#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabase = createClient(
  'https://irghpvvoparqettcnpnh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo'
);

// Simple MCP server using stdin/stdout
console.log('🚀 Starting Simple Supabase MCP Server...');
console.log('📊 Database connected');
console.log('📝 This server works with Cursor via stdin/stdout');

// Handle input from Cursor
process.stdin.on('data', async (data) => {
  try {
    const input = data.toString().trim();
    
    if (input.includes('listTables')) {
      // List available tables
      const tables = ['cities', 'conversations', 'messages', 'crawls_documents'];
      console.log(`📋 Available tables: ${tables.join(', ')}`);
    }
    else if (input.includes('queryDatabase')) {
      // Query database
      if (input.includes('cities')) {
        const { data: cities, error } = await supabase
          .from('cities')
          .select('name, lat, lng, is_active')
          .limit(5);
        
        if (error) {
          console.log(`❌ Error: ${error.message}`);
        } else {
          console.log(`🏙️ Cities found: ${cities.length}`);
          cities.forEach(city => {
            console.log(`  - ${city.name} (${city.lat}, ${city.lng}) - Active: ${city.is_active}`);
          });
        }
      }
      else if (input.includes('conversations')) {
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('*')
          .limit(5);
        
        if (error) {
          console.log(`❌ Error: ${error.message}`);
        } else {
          console.log(`💬 Conversations found: ${conversations.length}`);
          conversations.forEach(conv => {
            console.log(`  - ID: ${conv.id}, City: ${conv.city_id}`);
          });
        }
      }
      else {
        console.log('❓ Please specify a table: cities, conversations, messages, or crawls_documents');
      }
    }
    else if (input.includes('help')) {
      console.log('📚 Available commands:');
      console.log('  - listTables: Show available tables');
      console.log('  - queryDatabase table:cities: Query cities table');
      console.log('  - queryDatabase table:conversations: Query conversations table');
      console.log('  - help: Show this help message');
    }
    else {
      console.log('❓ Unknown command. Type "help" for available commands.');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
});

// Keep the process alive
process.stdin.resume();
