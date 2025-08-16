#!/bin/bash

echo "🚀 Starting All MCP Servers..."
echo "📊 Supabase MCP: Database access"
echo "🌐 Browser MCP: Web automation"
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

echo "🔧 Starting Supabase MCP server in background..."
node mcp/simple-mcp-server.js &
SUPABASE_PID=$!

echo "🌐 Starting Browser MCP server in background..."
node mcp/start-browsermcp-server.js &
BROWSER_PID=$!

echo ""
echo "✅ Both MCP servers are now running!"
echo "📊 Supabase MCP PID: $SUPABASE_PID"
echo "🌐 Browser MCP PID: $BROWSER_PID"
echo ""
echo "🔄 Keep this terminal open while using Cursor"
echo "🛑 Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all MCP servers..."
    kill $SUPABASE_PID 2>/dev/null
    kill $BROWSER_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait

