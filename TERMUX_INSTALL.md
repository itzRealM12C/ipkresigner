# Termux Installation Guide

## Super Easy Installation - Just 2 Steps!

### Step 1: Install Node.js
```bash
pkg install nodejs -y
```

### Step 2: Download and Use
Download `webos-resign-standalone.js` to your device, then:

```bash
node webos-resign-standalone.js resign your-app.ipk -o new-app.ipk
```

That's it! No npm packages, no complex setup - just one file that does everything.

## Manual Installation Steps

If you prefer to install manually:

### 1. Install Dependencies
```bash
pkg update -y
pkg install -y nodejs npm git
```

### 2. Create Directory
```bash
mkdir -p ~/webos-ipk-resigner
cd ~/webos-ipk-resigner
```

### 3. Download Tool Files
Download these files from your Replit project:
- `index.js`
- `package.json` 
- `bin/webos-resign.js`
- `lib/ipk-extractor.js`
- `lib/ipk-packer.js`
- `lib/webos-cli.js`
- `lib/certificate-manager.js`
- `lib/utils.js`

### 4. Install Dependencies
```bash
npm install
```

### 5. Make Executable
```bash
chmod +x bin/webos-resign.js
```

### 6. Add to PATH
```bash
echo 'export PATH="$HOME/webos-ipk-resigner:$PATH"' >> ~/.bashrc
echo 'alias webos-resign="node $HOME/webos-ipk-resigner/index.js"' >> ~/.bashrc
source ~/.bashrc
```

## Usage After Installation

```bash
# Resign an IPK file
webos-resign resign youtube.ipk -o youtube_resigned.ipk -v

# Validate IPK signature  
webos-resign validate youtube_resigned.ipk -v

# Extract IPK contents
webos-resign extract youtube.ipk -o extracted/ -v
```

## Notes for Termux

- Make sure you have sufficient storage space (at least 200MB)
- The tool requires Node.js 14+ which should be available in Termux
- webOS CLI tools (@webosose/ares-cli) will be installed automatically
- Some operations may take longer on mobile devices compared to desktop