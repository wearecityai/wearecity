#!/bin/bash

echo "🌐 Starting Browser MCP Server..."
echo "📱 This server will allow Cursor to control your browser"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules/@browsermcp" ]; then
    echo "📦 Installing Browser MCP dependencies..."
    npm install @browsermcp/mcp
fi

# Check if the Browser MCP server exists
if [ ! -f "node_modules/@browsermcp/mcp/dist/index.js" ]; then
    echo "❌ Browser MCP server not found. Please check the installation."
    exit 1
fi

echo "🔧 Starting Browser MCP server..."
echo "📝 Server will communicate with Cursor via stdin/stdout"
echo "🔄 Keep this terminal open while using Cursor"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the Browser MCP server
node mcp/start-browsermcp-server.js

