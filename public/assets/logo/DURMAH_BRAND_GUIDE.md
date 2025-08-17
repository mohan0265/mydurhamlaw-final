# Durmah Brand Assets Guide

## 🎨 Brand Identity

**Durmah** is the legal AI voice assistant for MyDurhamLaw, designed to be a trusted legal companion for Durham University law students.

### Brand Essence
- **Name**: Durmah (derived from "Durham" + AI)
- **Tagline**: "Your Legal Voice Buddy"
- **Personality**: Professional, trustworthy, approachable, intelligent
- **Target Audience**: Durham University law students
- **Core Function**: AI-powered legal voice assistant

## 🖼️ Logo Variants

### 1. Full Logo (`durmah-logo.svg`)
- **Size**: 120x120px
- **Use Case**: Primary branding, splash screens, main displays
- **Features**: Complete logo with legal scales, "D" monogram, circuit patterns
- **Best For**: Hero sections, main branding areas

### 2. Icon Version (`durmah-icon.svg`)
- **Size**: 64x64px
- **Use Case**: App icons, small spaces, navigation
- **Features**: Simplified scales and "D" for clarity at small sizes
- **Best For**: Favicons, toolbar icons, compact spaces

### 3. Wordmark (`durmah-wordmark.svg`)
- **Size**: 280x80px (horizontal)
- **Use Case**: Headers, business cards, horizontal layouts
- **Features**: Icon + "DURMAH" text + tagline
- **Best For**: Headers, footers, horizontal branding

### 4. Monogram (`durmah-monogram.svg`)
- **Size**: 48x48px (square)
- **Use Case**: Profile pictures, social media, tight spaces
- **Features**: "D" with minimal legal scale accent
- **Best For**: Avatar images, social profiles, minimal spaces

## 🎨 Color Palette

### Primary Gradient
- **Purple to Indigo**: `#7c3aed → #4f46e5 → #3730a3`
- **Usage**: Main brand elements, backgrounds
- **Inspiration**: MyDurhamLaw purple theme, premium feel

### Supporting Colors
- **White**: `#ffffff` - Text, icons, contrast elements
- **Gray**: `#6b7280` - Secondary text, subtle elements
- **Accent**: Various state colors (green for listening, blue for speaking)

## 🔧 Technical Specifications

### File Formats
- **SVG**: Vector format, scalable, web-optimized
- **Recommended**: Use SVG for all web applications
- **Future**: PNG variants can be generated from SVG as needed

### Sizing Guidelines
- **Minimum Size**: 24px for icon variants
- **Maximum Size**: No limit for SVG (vector)
- **Recommended**: Use appropriate variant for each size range

## 📱 Usage in React Components

### Import and Use
```tsx
import { DurmahLogo, DurmahIcon, DurmahWordmark, DurmahMonogram } from '@/components/ui/DurmahLogo';

// Full logo with different sizes
<DurmahLogo variant="full" size="lg" />

// Quick access to variants
<DurmahIcon size="md" />
<DurmahWordmark size="lg" />
<DurmahMonogram size="sm" />
```

### Available Props
- **variant**: `'full' | 'icon' | 'wordmark' | 'monogram'`
- **size**: `'sm' | 'md' | 'lg' | 'xl'`
- **className**: Additional CSS classes

## 🎯 Brand Guidelines

### Do's
✅ Use consistent purple gradient theme
✅ Maintain proper spacing around logos
✅ Use appropriate variant for each context
✅ Ensure good contrast with backgrounds
✅ Keep legal scales symbol visible and recognizable

### Don'ts
❌ Don't stretch or distort logos
❌ Don't change colors outside brand palette
❌ Don't use on low-contrast backgrounds
❌ Don't remove or modify legal scale elements
❌ Don't use outdated or unofficial versions

## 🔄 Version History

- **v1.0**: Initial brand identity creation
  - Full logo with legal scales and AI circuit patterns
  - Complete variant set (full, icon, wordmark, monogram)
  - React component integration
  - Professional purple gradient theme

## 📞 Brand Contact

For brand guidelines questions or new asset requests, refer to the MyDurhamLaw development team.

---

*This brand guide ensures consistent and professional representation of Durmah across all MyDurhamLaw platforms.*