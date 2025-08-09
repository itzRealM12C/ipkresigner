#!/bin/bash

# webOS IPK Resigner Terminal Launcher
# This script starts the complete terminal interface

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HTML_FILE="$SCRIPT_DIR/webos-resigner-terminal.html"
PORT=5000

echo "🚀 Starting webOS IPK Resigner Terminal..."
echo "📁 Project directory: $SCRIPT_DIR"

# Check if HTML file exists
if [ ! -f "$HTML_FILE" ]; then
    echo "❌ Terminal HTML file not found: $HTML_FILE"
    exit 1
fi

# Start simple HTTP server to serve the HTML
echo "🌐 Starting web server on port $PORT..."

# Try different server options
if command -v python3 &> /dev/null; then
    echo "📡 Using Python 3 HTTP server"
    cd "$SCRIPT_DIR"
    python3 -m http.server $PORT &
    SERVER_PID=$!
elif command -v python &> /dev/null; then
    echo "📡 Using Python 2 HTTP server"
    cd "$SCRIPT_DIR"
    python -m SimpleHTTPServer $PORT &
    SERVER_PID=$!
elif command -v node &> /dev/null; then
    echo "📡 Using Node.js HTTP server"
    cd "$SCRIPT_DIR"
    node -e "
    const http = require('http');
    const fs = require('fs');
    const path = require('path');
    const url = require('url');

    const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url);
        let pathname = parsedUrl.pathname;
        
        if (pathname === '/') {
            pathname = '/webos-resigner-terminal.html';
        }
        
        const filePath = path.join(__dirname, pathname);
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            const ext = path.extname(filePath);
            let contentType = 'text/html';
            
            switch (ext) {
                case '.js':
                    contentType = 'application/javascript';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
                case '.json':
                    contentType = 'application/json';
                    break;
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });

    server.listen($PORT, () => {
        console.log('Server running on port $PORT');
    });
    " &
    SERVER_PID=$!
else
    echo "❌ No HTTP server available (Python or Node.js required)"
    echo "📋 You can open the HTML file directly in your browser:"
    echo "   file://$HTML_FILE"
    exit 1
fi

# Save PID for cleanup
echo $SERVER_PID > "$SCRIPT_DIR/.server.pid"

echo "✅ Server started successfully!"
echo "🌐 Open your browser and go to: http://localhost:$PORT"
echo "📱 Or directly open: http://localhost:$PORT/webos-resigner-terminal.html"
echo ""
echo "📋 Features available:"
echo "   • Drag & drop IPK files"
echo "   • One-click resigning"
echo "   • Signature validation"  
echo "   • Content extraction"
echo "   • Terminal-style interface"
echo ""
echo "🛑 Press Ctrl+C to stop the server"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping server..."
    if [ -f "$SCRIPT_DIR/.server.pid" ]; then
        local pid=$(cat "$SCRIPT_DIR/.server.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo "✅ Server stopped"
        fi
        rm -f "$SCRIPT_DIR/.server.pid"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for server
wait $SERVER_PID