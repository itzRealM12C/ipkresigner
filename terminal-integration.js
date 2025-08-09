// webOS IPK Resigner Terminal Integration
// This script bridges the HTML terminal with the backend processes

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const formidable = require('formidable');

class WebOSTerminalServer {
    constructor(port = 3000) {
        this.port = port;
        this.tempDir = path.join(__dirname, 'temp_uploads');
        this.server = null;
        this.init();
    }

    init() {
        // Create temp directory
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }

        // Create HTTP server
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        console.log('🚀 webOS Terminal Server initialized');
    }

    handleRequest(req, res) {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        switch (url.pathname) {
            case '/upload':
                this.handleUpload(req, res);
                break;
            case '/resign':
                this.handleResign(req, res);
                break;
            case '/validate':
                this.handleValidate(req, res);
                break;
            case '/extract':
                this.handleExtract(req, res);
                break;
            case '/status':
                this.handleStatus(req, res);
                break;
            case '/download':
                this.handleDownload(req, res);
                break;
            default:
                this.serve404(res);
        }
    }

    handleUpload(req, res) {
        const form = new formidable.IncomingForm();
        form.uploadDir = this.tempDir;
        form.keepExtensions = true;

        form.parse(req, (err, fields, files) => {
            if (err) {
                this.sendError(res, 'Upload failed', err.message);
                return;
            }

            const uploadedFile = files.ipkFile;
            if (!uploadedFile || !uploadedFile.originalFilename.endsWith('.ipk')) {
                this.sendError(res, 'Invalid file', 'Please upload a valid IPK file');
                return;
            }

            // Move file to permanent location
            const fileName = `${Date.now()}_${uploadedFile.originalFilename}`;
            const filePath = path.join(this.tempDir, fileName);
            
            fs.renameSync(uploadedFile.filepath, filePath);

            this.sendSuccess(res, 'File uploaded successfully', {
                fileName: fileName,
                originalName: uploadedFile.originalFilename,
                size: uploadedFile.size,
                path: filePath
            });
        });
    }

    async handleResign(req, res) {
        try {
            const { fileName } = await this.parseJSON(req);
            const inputPath = path.join(this.tempDir, fileName);
            const outputPath = path.join(this.tempDir, fileName.replace('.ipk', '_resigned.ipk'));

            console.log('🔏 Resigning IPK:', fileName);

            // Execute resign command
            const result = await this.executeCommand('resign', inputPath, outputPath);
            
            this.sendSuccess(res, 'IPK resigned successfully', {
                outputFile: path.basename(outputPath),
                size: fs.statSync(outputPath).size,
                downloadUrl: `/download?file=${path.basename(outputPath)}`
            });

        } catch (error) {
            this.sendError(res, 'Resign failed', error.message);
        }
    }

    async handleValidate(req, res) {
        try {
            const { fileName } = await this.parseJSON(req);
            const inputPath = path.join(this.tempDir, fileName);

            console.log('🔍 Validating IPK:', fileName);

            // Execute validate command
            const result = await this.executeCommand('validate', inputPath);
            
            this.sendSuccess(res, 'IPK validation completed', result);

        } catch (error) {
            this.sendError(res, 'Validation failed', error.message);
        }
    }

    async handleExtract(req, res) {
        try {
            const { fileName } = await this.parseJSON(req);
            const inputPath = path.join(this.tempDir, fileName);
            const outputDir = path.join(this.tempDir, fileName.replace('.ipk', '_extracted'));

            console.log('📦 Extracting IPK:', fileName);

            // Execute extract command
            const result = await this.executeCommand('extract', inputPath, outputDir);
            
            // Create zip of extracted contents
            const zipPath = await this.createZip(outputDir, outputDir + '.zip');
            
            this.sendSuccess(res, 'IPK extracted successfully', {
                extractedDir: path.basename(outputDir),
                zipFile: path.basename(zipPath),
                downloadUrl: `/download?file=${path.basename(zipPath)}`
            });

        } catch (error) {
            this.sendError(res, 'Extraction failed', error.message);
        }
    }

    handleStatus(req, res) {
        const files = fs.readdirSync(this.tempDir)
            .filter(f => f.endsWith('.ipk'))
            .map(f => ({
                name: f,
                size: fs.statSync(path.join(this.tempDir, f)).size,
                modified: fs.statSync(path.join(this.tempDir, f)).mtime
            }));

        this.sendSuccess(res, 'Status retrieved', {
            serverTime: new Date().toISOString(),
            tempDir: this.tempDir,
            files: files,
            nodeVersion: process.version
        });
    }

    handleDownload(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const fileName = url.searchParams.get('file');
        
        if (!fileName) {
            this.sendError(res, 'Download failed', 'No file specified');
            return;
        }

        const filePath = path.join(this.tempDir, fileName);
        
        if (!fs.existsSync(filePath)) {
            this.sendError(res, 'Download failed', 'File not found');
            return;
        }

        // Set download headers
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // Stream file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    }

    executeCommand(command, ...args) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, 'webos-terminal-backend.sh');
            const child = spawn('bash', [scriptPath, command, ...args]);

            let output = '';
            let error = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                error += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ output, success: true });
                } else {
                    reject(new Error(error || `Command failed with code ${code}`));
                }
            });
        });
    }

    async createZip(sourceDir, outputPath) {
        return new Promise((resolve, reject) => {
            const command = `cd "${sourceDir}" && zip -r "${outputPath}" .`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(outputPath);
                }
            });
        });
    }

    parseJSON(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(new Error('Invalid JSON'));
                }
            });
        });
    }

    sendSuccess(res, message, data = null) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: message,
            data: data,
            timestamp: new Date().toISOString()
        }));
    }

    sendError(res, title, message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: title,
            message: message,
            timestamp: new Date().toISOString()
        }));
    }

    serve404(res) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🌐 webOS Terminal Server running on http://localhost:${this.port}`);
            console.log(`📁 Upload directory: ${this.tempDir}`);
            console.log('🔄 Ready to process IPK files');
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 Server stopped');
        }
    }
}

// Start server if run directly
if (require.main === module) {
    const port = process.argv[2] || 3000;
    const server = new WebOSTerminalServer(port);
    server.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        server.stop();
        process.exit(0);
    });
}

module.exports = WebOSTerminalServer;