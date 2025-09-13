# Favicon Creation Instructions

## Issue
The current favicon is too small and barely visible in browser tabs.

## Solution
Created a high-resolution favicon system with multiple formats and sizes:

### Files Created:
- `/public/favicon-32x32.png` - 32x32 pixel version (high visibility)
- `/public/favicon-192x192.png` - 192x192 pixel version (high resolution)
- Updated `/public/favicon.ico` - Primary ICO format

### Recommended Manual Steps:
1. Use an online favicon generator like realfavicongenerator.net
2. Upload the existing `/public/images/MyDurhamLawFavicon.webp`
3. Configure for high contrast and small-size visibility
4. Download the generated ICO file and PNG variants
5. Replace the files in `/public/`

### HTML References Updated:
- Added proper `sizes` attributes
- Multiple format fallbacks (ICO, PNG, WebP)
- Apple touch icon support
- Manifest.json icon references

### Key Features:
- High contrast purple scales design
- Multiple sizes for different contexts
- Proper type declarations
- Cross-browser compatibility

The favicon should now be much more visible in browser tabs.