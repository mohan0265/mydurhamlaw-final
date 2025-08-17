# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server (Next.js)
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint linting
- `npm run type-check` - Run TypeScript type checking (use `tsc --noEmit`)

### Environment Setup
- Copy `.env.example` to `.env.local` for local development
- Required environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`
- Server-side variables (no NEXT_PUBLIC prefix): API keys, encryption keys, service role keys
- Client-side variables (NEXT_PUBLIC prefix): Supabase URL/anon key, app URL/name

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS with custom components
- **Backend**: Next.js API routes + Supabase
- **Database**: Supabase (PostgreSQL with auth)
- **AI**: OpenAI GPT-4 integration
- **News Feeds**: RSS aggregation for UK legal news (Law Gazette, Government, etc.)
- **Security**: Rate limiting, input sanitization, CSP headers

### Key Architectural Patterns

#### Year-Based User System
The app uses a year-based routing system for Durham Law students:
- Foundation year: `/dashboard/foundation`
- Year 1-3: `/dashboard/year1`, `/dashboard/year2`, `/dashboard/year3`
- User types stored in Supabase profiles table and auth metadata
- `AuthContext` manages user state and provides `getDashboardRoute()` function

#### Durham Law Integration
- `src/lib/durham/modules.ts` - Complete Durham Law module system with validation
- `src/lib/durham/academicCalendar.ts` - Academic calendar integration
- `src/lib/durham/delsa.ts` - DELSA (Durham E-Learning Support) integration
- Module selection validation, prerequisite checking, career path recommendations

#### Security Architecture
- Rate limiting on API routes using `withRateLimit` middleware
- Input sanitization via `sanitizeInput` function
- Comprehensive CSP headers in `next.config.js`
- Encryption utilities for sensitive data in `src/lib/security/`

#### AI Integration Pattern
- Main chat API: `/api/chat.ts` with GPT-4 integration
- Memory-aware prompts: `src/lib/prompts/MemoryManagerAgent/prompt.ts`
- Voice chat: `src/lib/openaiVoice.ts` with speech-to-text integration
- AI history tracking via Supabase

### Component Architecture

#### Layout Components
- `src/components/layout/ModernSidebar.tsx` - Main navigation
- `src/components/Header.tsx` / `src/components/Footer.tsx` - Page headers/footers
- Year-specific signup components in `src/pages/signup/`

#### AI Components
- `src/components/ChatInterface.tsx` - Main chat component
- `src/components/VoiceChatInterface.tsx` - Voice chat with real-time transcription
- `src/components/agents/` - Specialized AI agents (Memory Manager, etc.)

#### UI System
- Base components in `src/components/ui/` (Button, Input, Card, etc.)
- Dashboard widgets in `src/components/dashboard/`
- Chat components in `src/components/chat/`

### Data Flow Patterns

#### Authentication Flow
1. User signs up via year-specific forms (`/signup/Year1SignUp.tsx`, etc.)
2. Profile created in Supabase with `user_type` field
3. `AuthContext` manages session and routes to appropriate dashboard
4. `withAuthProtection` HOC protects routes

#### AI Chat Flow
1. User input → `ChatInterface` component
2. API call to `/api/chat.ts` with rate limiting
3. Input sanitization → OpenAI API call
4. Response with updated conversation memory
5. History saved to Supabase via `aiHistory.ts`

#### Module Management Flow
1. Student profile determines available modules via `DurhamModuleManager`
2. Module selection validated against prerequisites and credit requirements
3. Career recommendations provided based on selected path
4. Study tips generated per module

### Important File Locations

#### Configuration
- `next.config.js` - Security headers, CSP, webpack config
- `.env.example` - Environment variable template with security notes
- `src/lib/supabase/client.ts` - Supabase client configuration

#### Core Logic
- `src/lib/supabase/AuthContext.tsx` - Authentication state management
- `src/lib/durham/modules.ts` - Durham Law module system
- `src/lib/middleware/rateLimiter.ts` - API rate limiting
- `src/lib/security/` - Security utilities (encryption, sanitization)

#### API Routes
- `/api/chat.ts` - Main AI chat endpoint
- `/api/wellbeing-coach.ts` - Specialized wellbeing AI
- `/api/assignment-generator.ts` - Assignment generation
- `/api/writing-samples/` - Writing analysis and similarity checking

#### News Integration
- `src/lib/news/fetchDurhamLawNews.ts` - Durham University news fetching with caching
- `src/pages/api/rss-news.ts` - RSS aggregation API for UK legal news feeds
- `src/pages/legal/tools/legal-news-feed.tsx` - Combined RSS + Durham news feed
- Features: RSS parsing, auto-refresh, filtering, voice narration, AI analysis

### Development Guidelines

#### Security Requirements
- All API routes must use rate limiting via `withRateLimit`
- User input must be sanitized before processing
- API keys must be server-side only (no NEXT_PUBLIC prefix)
- Follow CSP headers defined in next.config.js

#### Durham Law Specifics
- Use `DurhamModuleManager` for all module-related operations
- Validate module selections before saving
- Provide career-specific recommendations
- Integrate with academic calendar for timing

#### Component Patterns
- Use TypeScript interfaces for all props
- Follow existing UI component patterns in `src/components/ui/`
- Implement responsive design with Tailwind CSS
- Use Supabase client for all database operations

### Testing Notes
- No specific test framework configured
- Manual testing via development server
- Type checking via `npm run type-check`
- Linting via `npm run lint`