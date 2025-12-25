// Prevent accidental exposure of service role key in frontend builds.
// This runs during "prebuild". Netlify build env must NOT contain service key.
const isBuild = process.env.NODE_ENV === 'production' || process.argv.includes('--check')
const serviceKeys = [
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.SUPABASE_SERVICE_KEY
]

if (serviceKeys.some(Boolean)) {
  console.error(
    '[guard-env] SUPABASE_SERVICE_ROLE_KEY (or SERVICE_KEY) is set in the build environment. ' +
    'Remove it from Next.js build vars; keep it only in Netlify Functions/Server context.'
  )
  process.exit(1)
} else if (isBuild) {
  console.log('[guard-env] OK: no service role key in build env.')
}
