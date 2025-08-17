# MyDurhamLaw - Complete Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18.18.0 or higher
- npm 9.0.0 or higher
- Supabase account
- Optional: OpenAI API key, ElevenLabs API key

### 1. Environment Setup

1. Copy environment template:
```bash
cp .env.example .env.local
```

2. Configure your environment variables in `.env.local`:
```env
# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Required - Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MyDurhamLaw AI Study App

# Optional - AI Features
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the migrations:
```bash
supabase migration up
```

### 3. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000

### 4. Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🌐 Deployment Options

### Netlify (Recommended)

1. Connect your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18`

3. Add environment variables in Netlify dashboard
4. Deploy!

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Add environment variables in Vercel dashboard

### Other Platforms

The application is a standard Next.js app and can be deployed to:
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform
- Any Node.js hosting provider

## 🔧 Configuration

### Feature Flags

Control which features are enabled using environment variables:

```env
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_VOICE_FEATURES=true
NEXT_PUBLIC_ENABLE_PODCAST_FEATURES=true
NEXT_PUBLIC_ENABLE_WELLBEING_FEATURES=true
```

### Voice Configuration

```env
ELEVENLABS_VOICE_ID=your_preferred_voice_id
ELEVENLABS_MODEL=eleven_turbo_v2
```

### Security

```env
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=your_production_url
```

## 📱 Features Overview

### Core Features
- ✅ User authentication via Supabase Auth
- ✅ Academic calendar and planner
- ✅ Study materials management
- ✅ Assignment tracking
- ✅ Community features
- ✅ Legal tools and resources

### AI-Powered Features (Optional)
- 🤖 AI study assistant
- 🎙️ Voice interactions
- 📝 Writing assistance
- 📊 Progress analytics

### Wellbeing Features
- 💚 Mental health resources
- 🏃 Fitness tracking integration
- 📱 Mobile-responsive design

## 🛠️ Development

### Project Structure
```
src/
├── components/     # React components
├── pages/         # Next.js pages (Pages Router)
├── lib/           # Utility functions and services
├── hooks/         # Custom React hooks
├── styles/        # CSS and styling
├── types/         # TypeScript type definitions
└── constants/     # App constants
```

### Key Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
npm run type-check   # TypeScript checking
npm run test:unit    # Unit tests
npm run test:e2e     # End-to-end tests
```

## 🔍 Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all environment variables are set
2. **Database Issues**: Verify Supabase URL and keys
3. **Node Version**: Use Node.js 18.18.0 or higher
4. **Dependencies**: Run `npm install --legacy-peer-deps` if needed

### Support

For technical support:
1. Check the documentation
2. Review error logs
3. Verify environment configuration
4. Ensure database migrations are applied

## 🎯 Next Steps

1. Deploy to your preferred platform
2. Configure your domain
3. Set up monitoring and analytics
4. Customize branding and content
5. Add additional integrations as needed

---

**MyDurhamLaw Team**  
*AI-powered legal education for Durham University students*