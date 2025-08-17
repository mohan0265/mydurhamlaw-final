// Debug page to help troubleshoot OAuth flow issues
// Access this at: https://www.mydurhamlaw.com/debug-auth

import { useEffect, useState } from 'react'
import { getSupabaseClient, debugAuthState } from '@/lib/supabase/client'
import { getAuthRedirect } from '@/lib/authRedirect'

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  
  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    const results = []
    
    // Test 1: Environment Variables
    results.push({
      test: 'Environment Variables',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PASS' : 'FAIL',
      details: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
        urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      }
    })

    // Test 2: Current Session
    const { session, error } = await debugAuthState()
    results.push({
      test: 'Current Session',
      status: session ? 'PASS' : 'FAIL',
      details: {
        hasSession: !!session,
        userId: session?.user?.id || 'None',
        email: session?.user?.email || 'None',
        error: error ? (error as any)?.message || String(error) : 'None'
      }
    })

    // Test 3: URL Parameters (check for OAuth callback)
    const urlParams = new URLSearchParams(window.location.search)
    const hasCode = urlParams.has('code')
    const hasError = urlParams.has('error')
    
    results.push({
      test: 'URL Parameters',
      status: hasCode ? 'OAUTH_CALLBACK' : 'NORMAL_PAGE',
      details: {
        hasCode: hasCode,
        hasError: hasError,
        code: hasCode ? urlParams.get('code')?.substring(0, 20) + '...' : 'None',
        error: hasError ? urlParams.get('error') : 'None',
        fullUrl: window.location.href
      }
    })

    // Test 4: Local Storage
    const authToken = localStorage.getItem('supabase.auth.token')
    results.push({
      test: 'Local Storage',
      status: authToken ? 'PASS' : 'FAIL',
      details: {
        hasAuthToken: !!authToken,
        tokenLength: authToken?.length || 0,
        storageKeys: Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth'))
      }
    })

    // Test 5: Supabase Connection
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        results.push({
          test: 'Supabase Connection',
          status: 'FAIL',
          details: {
            connected: false,
            error: 'Supabase client not available'
          }
        })
      } else {
        const { data, error } = await supabase.auth.getUser()
        results.push({
          test: 'Supabase Connection',
          status: error ? 'FAIL' : 'PASS',
          details: {
            connected: !error,
            user: data?.user?.id || 'None',
            error: error?.message || 'None'
          }
        })
      }
    } catch (err: any) {
      results.push({
        test: 'Supabase Connection',
        status: 'FAIL',
        details: {
          connected: false,
          error: err.message
        }
      })
    }

    setTestResults(results)
    setDebugInfo({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      domain: window.location.hostname,
      protocol: window.location.protocol
    })
  }

  const testGoogleOAuth = async () => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        alert('Supabase client not available')
        return
      }

      const redirectTo = getAuthRedirect()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          scopes: 'openid email profile'
        }
      })

      if (error) {
        alert(`OAuth initiation failed: ${error.message}`)
      } else {
        alert('OAuth initiated successfully. You should be redirected to Google.')
      }
    } catch (err: any) {
      alert(`OAuth error: ${err.message}`)
    }
  }

  const clearAuthData = () => {
    localStorage.clear()
    sessionStorage.clear()
    const supabase = getSupabaseClient()
    if (supabase) {
      supabase.auth.signOut()
    }
    alert('Auth data cleared. Page will reload.')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 OAuth Debug Dashboard
          </h1>
          
          <div className="mb-6 flex gap-4">
            <button
              onClick={runDiagnostics}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              🔄 Run Diagnostics
            </button>
            <button
              onClick={testGoogleOAuth}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              🧪 Test Google OAuth
            </button>
            <button
              onClick={clearAuthData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              🧹 Clear Auth Data
            </button>
          </div>

          {debugInfo && (
            <div className="mb-6 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold text-gray-800 mb-2">Debug Info</h3>
              <pre className="text-xs text-gray-600">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border-l-4 ${
                  result.status === 'PASS' || result.status === 'OAUTH_CALLBACK'
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{result.test}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      result.status === 'PASS' || result.status === 'OAUTH_CALLBACK'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-semibold text-yellow-800 mb-2">
              🛠️ Troubleshooting Steps
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>1. Verify environment variables in Netlify dashboard</li>
              <li>2. Check Supabase Auth URL configuration</li>
              <li>3. Confirm Google OAuth redirect URIs</li>
              <li>4. Test OAuth flow with &quot;Test Google OAuth&quot; button</li>
              <li>5. Check browser console for detailed error messages</li>
            </ul>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>⚠️ This page should be removed in production for security.</p>
            <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Only show this page in development or when specifically accessed
export async function getServerSideProps(context: any) {
  // Remove this check in production if you need to debug live issues
  if (process.env.NODE_ENV === 'production' && !context.query.debug) {
    return {
      notFound: true
    }
  }
  
  return {
    props: {}
  }
}