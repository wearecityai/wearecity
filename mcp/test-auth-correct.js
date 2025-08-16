#!/usr/bin/env node

import fetch from 'node-fetch';

const MCP_BASE_URL = 'http://localhost:3000';
const API_KEY = 'city-chat-mcp-key-2024';

// Test MCP authentication and tools
async function testMCPServer() {
  console.log('🧪 Testing Supabase MCP Server Authentication...\n');

  try {
    // Test 1: Get MCP manifest (should work without auth)
    console.log('1️⃣ Testing MCP manifest...');
    const manifestResponse = await fetch(`${MCP_BASE_URL}/.well-known/mcp-manifest`);
    
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      console.log('✅ MCP manifest retrieved successfully');
      console.log('📋 Server name:', manifest.display_name);
      console.log('🔧 Capabilities:', manifest.capabilities.length);
    } else {
      console.log('❌ Failed to get MCP manifest:', manifestResponse.status);
      return;
    }

    console.log('');

    // Test 2: Test authentication with API key
    console.log('2️⃣ Testing authentication...');
    const authResponse = await fetch(`${MCP_BASE_URL}/tools/listTables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({})
    });
    
    if (authResponse.ok) {
      const result = await authResponse.json();
      console.log('✅ Authentication successful!');
      console.log('📊 Result:', result);
    } else {
      console.log('❌ Authentication failed:', authResponse.status, authResponse.statusText);
      
      // Try alternative authentication methods
      console.log('\n🔄 Trying alternative authentication methods...');
      
      // Method 1: API key in query parameter
      const queryAuthResponse = await fetch(`${MCP_BASE_URL}/tools/listTables?api_key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (queryAuthResponse.ok) {
        console.log('✅ Query parameter authentication successful!');
      } else {
        console.log('❌ Query parameter authentication failed');
      }
      
      // Method 2: API key in header
      const headerAuthResponse = await fetch(`${MCP_BASE_URL}/tools/listTables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({})
      });
      
      if (headerAuthResponse.ok) {
        console.log('✅ Header authentication successful!');
      } else {
        console.log('❌ Header authentication failed');
      }
    }

    console.log('');

    // Test 3: Test available endpoints
    console.log('3️⃣ Testing available endpoints...');
    const endpoints = [
      '/tools',
      '/tools/listTables',
      '/tools/queryDatabase',
      '/tools/insertData',
      '/tools/updateData',
      '/tools/deleteData'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${MCP_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        
        if (response.ok) {
          console.log(`✅ ${endpoint} - OK`);
        } else {
          console.log(`❌ ${endpoint} - ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing MCP server:', error.message);
  }
}

// Run tests
testMCPServer();


