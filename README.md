# MyDurhamLaw - AI-Powered Legal Study Assistant

## 🏛️ About

MyDurhamLaw is a comprehensive AI-powered study companion designed specifically for Durham University law students. It combines modern web technologies with artificial intelligence to provide personalized study assistance, academic planning, and community features.

## ✨ Features

### 📚 Academic Management
- **Smart Calendar**: Integrated academic calendar with Durham University term dates
- **Assignment Tracker**: Deadline management and progress tracking
- **Study Planner**: AI-powered study schedule optimization
- **Resource Library**: Curated legal materials and resources

### 🤖 AI-Powered Assistance
- **Intelligent Chat**: Context-aware AI assistant for legal queries
- **Writing Support**: AI-powered essay and legal writing assistance
- **Research Helper**: Advanced legal research capabilities
- **Voice Interactions**: Natural language voice commands and responses

### 👥 Community Features
- **Study Groups**: Connect with fellow law students
- **Discussion Forums**: Academic discussions and peer support
- **Mentorship**: Connect with senior students and alumni
- **Events**: University events and networking opportunities

### 🎯 Specialized Tools
- **Case Law Search**: Advanced legal database integration
- **Citation Generator**: Automatic legal citation formatting
- **Exam Preparation**: Practice questions and mock exams
- **Ethics Guide**: Legal ethics and professional conduct resources

### 💚 Wellbeing Support
- **Mental Health Resources**: Student support and counseling links
- **Study-Life Balance**: Wellness tracking and recommendations
- **Stress Management**: Mindfulness and relaxation tools

## 🚀 Quick Start

### For Students
1. Visit the deployed application
2. Sign up with your Durham University email
3. Complete the onboarding process
4. Start exploring features and tools

### For Developers
```bash
# Clone the repository
git clone <repository-url>
cd mydurmahlaw

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure your environment (see DEPLOYMENT_GUIDE.md)
# Then start development server
npm run dev
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **AI Services**: OpenAI GPT-4, ElevenLabs (Voice)
- **Deployment**: Netlify (recommended), Vercel compatible
- **Testing**: Vitest, Playwright

## 📁 Project Structure

```
mydurmahlaw/
├── src/
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── dashboard/    # Dashboard widgets
│   │   ├── chat/         # AI chat interface
│   │   ├── calendar/     # Calendar components
│   │   └── layout/       # Layout and navigation
│   ├── pages/            # Next.js pages (Pages Router)
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   └── tools/        # Legal tools
│   ├── lib/              # Utility functions
│   │   ├── supabase/     # Supabase configuration
│   │   ├── ai/           # AI service integrations
│   │   └── utils/        # Helper functions
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript definitions
│   └── styles/           # Global styles
├── supabase/
│   ├── migrations/       # Database migrations
│   ├── functions/        # Edge functions
│   └── config.toml       # Supabase configuration
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🔧 Configuration

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed setup instructions.

### Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional (for AI features):
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`

## 🧪 Testing

```bash
# Unit tests
npm run test:unit

# End-to-end tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [API Documentation](./docs/api.md) - API endpoints and usage
- [Component Library](./docs/components.md) - UI component documentation
- [Contributing Guide](./docs/contributing.md) - Development guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🏫 About Durham University

This application is designed specifically for Durham University law students and integrates with:
- Durham University academic calendar
- Durham Law School resources
- University support services
- Durham student community

## 🔗 Links

- [Durham University](https://www.durham.ac.uk/)
- [Durham Law School](https://www.durham.ac.uk/departments/academic/law/)
- [Student Support](https://www.durham.ac.uk/student-life/support/)

## 📞 Support

For technical support or questions:
- Check the documentation
- Review troubleshooting guide
- Contact the development team

---

**Made with ❤️ for Durham University Law Students**  
*Empowering legal education through technology*