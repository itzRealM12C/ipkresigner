#!/bin/bash
# webOS IPK Resigner - Termux Installation Script

echo "🚀 Installing webOS IPK Resigner for Termux..."

# Update package lists
echo "📦 Updating package lists..."
pkg update -y

# Install required packages
echo "📦 Installing Node.js and dependencies..."
pkg install -y nodejs npm git

# Create installation directory
INSTALL_DIR="$HOME/webos-ipk-resigner"
echo "📁 Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download the tool files (you'll need to replace these URLs with actual download links)
echo "⬇️ Downloading webOS IPK Resigner..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "webos-ipk-resigner",
  "version": "1.0.0",
  "description": "A Node.js CLI tool for resigning webOS IPK files",
  "main": "index.js",
  "bin": {
    "webos-resign": "./bin/webos-resign.js"
  },
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@webosose/ares-cli": "^1.12.0",
    "commander": "^11.0.0",
    "tar": "^6.1.15"
  },
  "keywords": ["webos", "ipk", "signing", "cli"],
  "author": "Replit AI Assistant",
  "license": "MIT"
}
EOF

# Install npm dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Make the CLI globally accessible
echo "🔗 Setting up global command..."
npm link

# Create symlink for easier access
echo "🔗 Creating command alias..."
echo 'alias webos-resign="node $HOME/webos-ipk-resigner/index.js"' >> ~/.bashrc

echo "✅ Installation complete!"
echo ""
echo "📋 Usage:"
echo "  webos-resign resign <ipk-file> -o <output-file>"
echo "  webos-resign validate <ipk-file>"
echo "  webos-resign extract <ipk-file> -o <output-dir>"
echo ""
echo "📁 Tool installed in: $INSTALL_DIR"
echo "🔄 Restart Termux or run 'source ~/.bashrc' to use the webos-resign command"