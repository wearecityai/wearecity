#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🌐 Starting Browser MCP Server...');
console.log('📱 This server will allow Cursor to control your browser');
console.log('');

// Start the Browser MCP server
const browsermcpServer = spawn('node', ['node_modules/@browsermcp/mcp/dist/index.js'], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd()
});

browsermcpServer.on('error', (error) => {
  console.error('❌ Failed to start Browser MCP server:', error);
  process.exit(1);
});

browsermcpServer.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Browser MCP server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Browser MCP server...');
  browsermcpServer.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Browser MCP server...');
  browsermcpServer.kill('SIGTERM');
});

// Keep the process alive
process.stdin.resume();

