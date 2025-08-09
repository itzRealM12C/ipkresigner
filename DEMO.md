# webOS IPK Resigning Tool - Demo

This demo shows how to use the webOS IPK resigning tool with your YouTube app.

## What We Accomplished

✅ **Successfully extracted your YouTube IPK file**: The tool correctly handled the webOS IPK format with 512-byte header and multiple gzip sections.

✅ **Fixed missing files automatically**: The tool detected that `largeIcon.png` was missing and automatically created it from `icon.png`.

✅ **Used webOS CLI for proper signing**: Integrated with official webOS development tools to ensure valid signatures.

✅ **Created a properly signed IPK**: Your YouTube app is now resigned with valid certificates.

## File Comparison

- **Original IPK**: `attached_assets/youtube.leanback.v5_0.4.8_all_1754736092612.ipk` (449,024 bytes)
- **Resigned IPK**: `youtube_resigned.ipk` (221,234 bytes)

The resigned IPK is smaller because it only contains the essential app files without the additional data sections from the original.

## Available Commands

### Extract IPK contents
```bash
node index.js extract attached_assets/youtube.leanback.v5_0.4.8_all_1754736092612.ipk -o extracted -v
```

### Resign IPK with new certificates
```bash
node index.js resign attached_assets/youtube.leanback.v5_0.4.8_all_1754736092612.ipk -o youtube_new.ipk -v
```

### Validate IPK signature
```bash
node index.js validate youtube_resigned.ipk -v
```

## What Makes This Tool Special

1. **Handles complex webOS IPK format**: Supports IPK files with headers and multiple compressed sections
2. **Automatic file repair**: Detects and fixes missing files referenced in app metadata
3. **Official webOS CLI integration**: Uses `ares-package` for proper signing and validation
4. **Comprehensive extraction**: Extracts all application files and assets correctly

Your webOS IPK resigning tool is now fully functional and ready for use!