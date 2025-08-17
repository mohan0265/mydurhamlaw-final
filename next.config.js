/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // IMPORTANT: Do NOT use `output: 'export'` — we deploy with Netlify's Next plugin
  poweredByHeader: false,

  // Enable strict TypeScript and ESLint checking
  eslint: { 
    ignoreDuringBuilds: false,
    dirs: ['src']
  },
  typescript: { 
    ignoreBuildErrors: false
  },

  // Optimize for production builds
  swcMinify: true,
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@headlessui/react', 'lucide-react']
  },

  images: {
    // Let the Next plugin handle images; no unoptimized static export mode
    unoptimized: false,
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  },

  env: {
    NEXT_PUBLIC_APP_NAME: 'MyDurhamLaw AI Study App',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
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
      {
        source: '/calendar/main',
        destination: '/calendar',
        permanent: false,
      },
      {
        source: '/news',
        destination: '/legal/tools/legal-news-feed',
        permanent: false,
      },
      {
        source: '/ai-tools',
        destination: '/wellbeing',
        permanent: false,
      },
      {
        source: '/resources',
        destination: '/study-materials',
        permanent: false,
      },
      {
        source: '/voice',
        destination: '/wellbeing',
        permanent: false,
      },
      {
        source: '/student-lounge',
        destination: '/lounge',
        permanent: false,
      },
      {
        source: '/community',
        destination: '/community-network',
        permanent: false,
      },
      // Add more aliases as needed
    ];
  },
};

module.exports = nextConfig;
