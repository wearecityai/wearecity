#!/bin/bash

echo "🚀 Starting City Chat Supabase MCP Server..."
echo "📊 Database: https://irghpvvoparqettcnpnh.supabase.co"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment variables
export SUPABASE_URL="https://irghpvvoparqettcnpnh.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo"
export MCP_API_KEY="city-chat-mcp-key-2024"

echo "🔧 Environment variables set"
echo "🔑 API Key: $MCP_API_KEY"
echo ""

# Start the MCP server
echo "🔧 Starting MCP server..."
echo "📡 Server will be available at http://localhost:3000"
echo "📋 MCP manifest: http://localhost:3000/.well-known/mcp-manifest"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node node_modules/supabase-mcp/dist/esm/index.js


