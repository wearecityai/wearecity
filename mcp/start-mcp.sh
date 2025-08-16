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

# Start the MCP server
echo "🔧 Starting MCP server..."
node mcp/supabase-mcp-advanced.js


