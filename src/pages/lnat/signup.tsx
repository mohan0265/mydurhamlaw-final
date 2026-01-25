import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Brain } from 'lucide-react';

export default function LnatSignupPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleLnatOnboarding() {
      if (user) {
        setLoading(true);
        try {
            // 1. Ensure LNAT Entitlement
            const res = await fetch('/api/entitlements/ensure-lnat', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to setup LNAT access');
            
            // 2. Redirect to LNAT Portal
            router.replace('/lnat');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to setup account');
            setLoading(false);
        }
      }
    }
    
    handleLnatOnboarding();
  }, [user, router]);

  const handleGoogleLogin = async () => {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/lnat/signup` : undefined
          }
      });
      if (error) {
          setError(error.message);
          setLoading(false);
      }
  };

  if (loading && user) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
             <div className="text-center animate-pulse">
                <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Setting up your LNAT workspace...</h2>
             </div>
          </div>
      );
  }

  return (
    <>
      <Head>
        <title>LNAT Mentor - Sign Up</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
         <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
             <div className="text-center">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 mb-4">
                     <Brain className="w-6 h-6" />
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 tracking-tight">LNAT Mentor</h2>
                 <p className="mt-2 text-sm text-gray-500">
                    For aspiring law applicants. Format-led preparation.
                 </p>
             </div>

             <div className="mt-8 space-y-4">
                 {error && (
                     <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                         {error}
                     </div>
                 )}

                 <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                 >
                    {loading ? (
                        <span>Connecting...</span>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </>
                    )}
                 </button>

                 <div className="mt-6 text-center text-xs text-gray-400">
                    By continuing, you agree to our Terms. <br/> This account is for LNAT preparation only.
                 </div>
             </div>
         </div>
      </div>
    </>
  );
}
