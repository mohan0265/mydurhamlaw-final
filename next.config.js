/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,

  // IMPORTANT: Do NOT use `output: 'export'` — we deploy with Netlify's Next plugin
  poweredByHeader: false,

  // Enable strict TypeScript and ESLint checking
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimize for production builds
  swcMinify: true,

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@headlessui/react', 'lucide-react'],
  },

  images: {
    // Let the Next plugin handle images; no unoptimized static export mode
    unoptimized: false,
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  env: {
    NEXT_PUBLIC_APP_NAME: 'MyDurhamLaw AI Study App',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // 🔧 Unify react-query across the app (fixes "No QueryClient set" at build)
  // 🧹 Durmah/AWY cleanup aliases - redirect imports to stubs
  webpack: (config) => {
    config.resolve = config.resolve || {};
    const alias = config.resolve.alias || {}
    const stub = (p) => path.resolve(process.cwd(), p)
    
    Object.assign(alias, {
      'react-query': '@tanstack/react-query',
      'react-query/devtools': '@tanstack/react-query-devtools',
      // Durmah/AWY stub aliases
      '@/components/DurmahWidget': stub('src/stubs/NullWidget.tsx'),
      '@/components/LegalEagleBuddy': stub('src/stubs/NullWidget.tsx'),
      '@/components/FloatingDurmah': stub('src/stubs/NullWidget.tsx'),
      '@/components/FloatingAWY': stub('src/stubs/NullWidget.tsx'),
      '@/components/AWYBootstrap': stub('src/stubs/NullWidget.tsx'),
      '@/components/ui/DurmahLogo': stub('src/stubs/NullWidget.tsx'),
      '@/context/DurmahContext': stub('src/stubs/awy.ts'),
      'durmah': stub('src/stubs/NullWidget.tsx'),
      '@/durmah': stub('src/stubs/NullWidget.tsx'),
      '@durmah': stub('src/stubs/NullWidget.tsx'),
      '@/awy': stub('src/stubs/awy.ts'),
      '@awy': stub('src/stubs/awy.ts'),
      '@/lib/awy': stub('src/stubs/awy.ts'),
      'awy': stub('src/stubs/awy.ts'),
    })
    
    config.resolve.alias = alias
    return config;
  },

  // Configure redirects and rewrites for better SEO
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/year-at-a-glance',
        permanent: false,
      },
      // Route aliases for old links
      { source: '/calendar/main', destination: '/calendar', permanent: false },
      { source: '/news', destination: '/legal/tools/legal-news-feed', permanent: false },
      { source: '/ai-tools', destination: '/wellbeing', permanent: false },
      { source: '/resources', destination: '/study-materials', permanent: false },
      { source: '/voice', destination: '/wellbeing', permanent: false },
      { source: '/student-lounge', destination: '/lounge', permanent: false },
      { source: '/community', destination: '/community-network', permanent: false },
    ];
  },
};

module.exports = nextConfig;
