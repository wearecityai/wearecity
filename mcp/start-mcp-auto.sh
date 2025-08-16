#!/bin/bash

echo "🚀 Starting Supabase MCP Server for Cursor..."
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

# Check if the simple MCP server exists
if [ ! -f "mcp/simple-mcp-server.js" ]; then
    echo "❌ MCP server file not found. Please check the installation."
    exit 1
fi

echo "🔧 Starting MCP server..."
echo "📝 Server will communicate with Cursor via stdin/stdout"
echo "🔄 Keep this terminal open while using Cursor"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the MCP server
node mcp/simple-mcp-server.js

