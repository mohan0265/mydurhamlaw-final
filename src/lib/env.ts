const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

export function validateEnv() {
  // Always return env vars safely, don't throw on client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || ''
  const openaiApiKey = process.env.OPENAI_API_KEY || ''
  
  // Only warn in development, don't crash the app
  if (typeof window !== 'undefined') {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Missing Supabase environment variables - some features may not work')
    }
    return { supabaseUrl, supabaseAnonKey, ELEVENLABS_API_KEY: elevenLabsApiKey, OPENAI_API_KEY: openaiApiKey }
  }

  // Server-side validation - only warn, don't throw
  const missing = requiredEnvVars.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`)
  }

  return { supabaseUrl, supabaseAnonKey, ELEVENLABS_API_KEY: elevenLabsApiKey, OPENAI_API_KEY: openaiApiKey }
}
