# Overview

webOS IPK Resigning Tool is a Node.js command-line application designed to extract, modify, and repackage webOS IPK (webOS Package) files with new digital certificates. The tool provides functionality to handle the complete IPK signing workflow, including extraction of existing packages, certificate management, and creation of properly signed IPK files compatible with webOS devices.

## Recent Changes (August 9, 2025)

✅ Successfully implemented webOS IPK format support with 512-byte header offset
✅ Added multi-section gzip extraction for complex IPK files  
✅ Integrated webOS CLI tools (@webosose/ares-cli) for proper signing
✅ Implemented automatic missing file detection and repair (largeIcon.png)
✅ Successfully tested with real YouTube webOS application IPK file
✅ Completed end-to-end resigning workflow with valid signature generation

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Architecture Pattern
The application follows a modular class-based architecture with clear separation of concerns. Each major functionality is encapsulated in dedicated classes that handle specific aspects of the IPK processing workflow.

## CLI Framework
Uses Commander.js for command-line interface implementation, providing structured argument parsing and command routing. The main entry point (`index.js`) orchestrates the overall workflow by coordinating between different components.

## File Processing Pipeline
The application implements a multi-stage processing pipeline:
- **Extraction Stage**: IPKExtractor class handles decompression and validation of IPK files (which are tar.gz archives)
- **Certificate Management Stage**: CertificateManager handles signature validation and certificate operations
- **Packaging Stage**: IPKPacker recreates IPK files with proper internal archive structure
- **Signing Integration**: WebOSCLI class provides integration with official webOS CLI tools for signing

## Error Handling Strategy
Implements comprehensive error handling with graceful degradation. The application catches exceptions at multiple levels and provides meaningful error messages. Process-level handlers manage unhandled rejections and uncaught exceptions.

## Temporary File Management
Uses system temporary directories with random identifiers for safe file operations. Includes cleanup utilities to prevent disk space accumulation from temporary files.

## Archive Format Handling
IPK files are treated as specialized tar.gz archives with specific internal structure requirements. The tool handles both the outer IPK container and internal archives (control.tar.gz, data.tar.gz) that contain package metadata and application data.

# External Dependencies

## Core Dependencies
- **Commander.js**: Command-line interface framework for argument parsing and command structure
- **tar**: Archive manipulation library for handling tar.gz compression and extraction operations

## System Dependencies
- **Node.js Built-in Modules**: Extensive use of fs (file system), path, crypto, child_process, os, stream, and zlib modules
- **webOS CLI Tools**: Optional integration with official webOS development tools (ares-package) for proper signing when available

## Runtime Requirements
- Node.js version 14 or higher for compatibility with modern JavaScript features and async/await patterns
- Access to system temporary directory for file operations
- Optional: webOS CLI tools installation for official signing capabilities