#!/usr/bin/env node

import fetch from 'node-fetch';

const MCP_BASE_URL = 'http://localhost:3000';
const API_KEY = 'city-chat-mcp-key-2024';

// Test MCP tools
async function testMCPTools() {
  console.log('🧪 Testing Supabase MCP Tools...\n');

  try {
    // Test 1: List tables
    console.log('1️⃣ Testing listTables...');
    const listTablesResponse = await fetch(`${MCP_BASE_URL}/tools/listTables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({})
    });
    
    if (listTablesResponse.ok) {
      const result = await listTablesResponse.json();
      console.log('✅ listTables result:', result);
    } else {
      console.log('❌ listTables failed:', listTablesResponse.status, listTablesResponse.statusText);
    }

    console.log('');

    // Test 2: Query cities
    console.log('2️⃣ Testing queryDatabase for cities...');
    const queryCitiesResponse = await fetch(`${MCP_BASE_URL}/tools/queryDatabase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        table: 'cities',
        select: 'name, country',
        query: {}
      })
    });
    
    if (queryCitiesResponse.ok) {
      const result = await queryCitiesResponse.json();
      console.log('✅ queryCities result:', result);
    } else {
      console.log('❌ queryCities failed:', queryCitiesResponse.status, queryCitiesResponse.statusText);
    }

    console.log('');

    // Test 3: Get available tools
    console.log('3️⃣ Testing available tools...');
    const toolsResponse = await fetch(`${MCP_BASE_URL}/tools`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (toolsResponse.ok) {
      const tools = await toolsResponse.json();
      console.log('✅ Available tools:', tools);
    } else {
      console.log('❌ Failed to get tools:', toolsResponse.status, toolsResponse.statusText);
    }

  } catch (error) {
    console.error('❌ Error testing MCP tools:', error.message);
  }
}

// Run tests
testMCPTools();


