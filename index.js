#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const IPKExtractor = require('./lib/ipk-extractor');
const IPKPacker = require('./lib/ipk-packer');
const CertificateManager = require('./lib/certificate-manager');
const WebOSCLI = require('./lib/webos-cli');
const { validateFile, createTempDir, cleanup } = require('./lib/utils');

const program = new Command();

program
  .name('webos-resign')
  .description('A Node.js CLI tool for resigning webOS IPK files')
  .version('1.0.0');

program
  .command('resign')
  .description('Resign an IPK file with new certificates')
  .argument('<ipk-file>', 'Path to the IPK file to resign')
  .option('-c, --cert <cert-file>', 'Path to new certificate file')
  .option('-k, --key <key-file>', 'Path to private key file')
  .option('-o, --output <output-file>', 'Output path for resigned IPK')
  .option('-t, --temp-dir <temp-dir>', 'Temporary directory for extraction')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (ipkFile, options) => {
    try {
      console.log('🚀 Starting IPK resigning process...');
      
      // Validate input file
      if (!validateFile(ipkFile)) {
        throw new Error(`IPK file not found: ${ipkFile}`);
      }

      // Setup paths
      const outputFile = options.output || ipkFile.replace('.ipk', '_resigned.ipk');
      const tempDir = options.tempDir || await createTempDir();
      
      if (options.verbose) {
        console.log(`📁 Using temporary directory: ${tempDir}`);
        console.log(`📦 Input IPK: ${ipkFile}`);
        console.log(`📦 Output IPK: ${outputFile}`);
      }

      // Initialize components
      const extractor = new IPKExtractor({ verbose: options.verbose });
      const packer = new IPKPacker({ verbose: options.verbose });
      const certManager = new CertificateManager({ verbose: options.verbose });
      const webOSCLI = new WebOSCLI({ verbose: options.verbose });

      // Step 1: Extract IPK
      console.log('📂 Extracting IPK file...');
      const extractedPath = await extractor.extract(ipkFile, tempDir);
      
      // Step 2: Validate existing signatures
      console.log('🔍 Validating existing signatures...');
      await certManager.validateExistingSignatures(extractedPath);

      // Step 3: Replace certificates if provided
      if (options.cert && options.key) {
        console.log('🔑 Replacing certificates...');
        await certManager.replaceCertificates(extractedPath, options.cert, options.key);
      } else {
        console.log('⚠️  No new certificates provided, using webOS CLI for signing...');
        await webOSCLI.signPackage(extractedPath);
      }

      // Step 4: Repackage IPK
      console.log('📦 Repackaging IPK...');
      await packer.pack(extractedPath, outputFile);

      // Step 5: Validate final signature
      console.log('✅ Validating final signature...');
      await certManager.validateFinalSignature(outputFile);

      console.log(`🎉 Successfully resigned IPK: ${outputFile}`);

      // Cleanup
      if (!options.tempDir) {
        await cleanup(tempDir);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate IPK signature integrity')
  .argument('<ipk-file>', 'Path to the IPK file to validate')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (ipkFile, options) => {
    try {
      console.log('🔍 Validating IPK signature...');
      
      if (!validateFile(ipkFile)) {
        throw new Error(`IPK file not found: ${ipkFile}`);
      }

      const certManager = new CertificateManager({ verbose: options.verbose });
      const isValid = await certManager.validateIPKSignature(ipkFile);
      
      if (isValid) {
        console.log('✅ IPK signature is valid');
      } else {
        console.log('❌ IPK signature is invalid');
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('extract')
  .description('Extract IPK file contents')
  .argument('<ipk-file>', 'Path to the IPK file to extract')
  .option('-o, --output <output-dir>', 'Output directory for extraction')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (ipkFile, options) => {
    try {
      console.log('📂 Extracting IPK file...');
      
      if (!validateFile(ipkFile)) {
        throw new Error(`IPK file not found: ${ipkFile}`);
      }

      const outputDir = options.output || path.join(process.cwd(), 'extracted');
      const extractor = new IPKExtractor({ verbose: options.verbose });
      
      const extractedPath = await extractor.extract(ipkFile, outputDir);
      console.log(`✅ IPK extracted to: ${extractedPath}`);

    } catch (error) {
      console.error('❌ Error:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

module.exports = program;
