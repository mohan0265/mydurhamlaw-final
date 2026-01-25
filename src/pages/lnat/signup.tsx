import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Brain, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LnatSignupPage() {
  const isLaunchEnabled = process.env.NEXT_PUBLIC_LNAT_LAUNCH_ENABLED === 'true';
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  
  // Auth State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Waitlist State
  const [waitlistForm, setWaitlistForm] = useState({
      name: '',
      email: '',
      role: 'Applicant',
      year: ''
  });
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  // AUTH MODE: Handle Post-Login Logic
  useEffect(() => {
    if (!isLaunchEnabled) return; // Don't run auth logic if not enabled

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
  }, [user, router, isLaunchEnabled]);

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

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          const res = await fetch('/api/lnat/waitlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(waitlistForm)
          });
          
          if (!res.ok) throw new Error('Failed to join waitlist');
          
          setJoinedWaitlist(true);
          toast.success("You're on the list!");
      } catch (err) {
          toast.error("Something went wrong. Please try again.");
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  if (isLaunchEnabled && loading && user) {
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
        <title>{isLaunchEnabled ? 'LNAT Mentor - Sign Up' : 'LNAT Mentor (Upcoming)'}</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
         <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
             <div className="text-center">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 mb-4">
                     <Brain className="w-6 h-6" />
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    {isLaunchEnabled ? 'LNAT Mentor' : 'LNAT Mentor (Upcoming)'}
                 </h2>
                 <p className="mt-2 text-sm text-gray-500">
                    {isLaunchEnabled 
                        ? 'For aspiring law applicants. Format-led preparation.' 
                        : 'Join the early access list.'}
                 </p>
             </div>

             <div className="mt-8 space-y-4">
                 
                 {/* WAITLIST MODE */}
                 {!isLaunchEnabled && !joinedWaitlist && (
                     <form onSubmit={handleWaitlistSubmit} className="space-y-4 text-left">
                        <div className="p-4 bg-purple-50 rounded-xl text-sm text-purple-800 border border-purple-100 mb-4">
                             LNAT Mentor is currently in development. Leave your details and we’ll notify you as soon as early access opens.
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input 
                                required
                                type="text" 
                                className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                                value={waitlistForm.name}
                                onChange={e => setWaitlistForm({...waitlistForm, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input 
                                required
                                type="email" 
                                className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                                value={waitlistForm.email}
                                onChange={e => setWaitlistForm({...waitlistForm, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
                            <select 
                                className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                                value={waitlistForm.role}
                                onChange={e => setWaitlistForm({...waitlistForm, role: e.target.value})}
                            >
                                <option>Applicant</option>
                                <option>Foundation Student</option>
                                <option>Parent</option>
                                <option>Teacher</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Intended Intake (Optional)</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 2026"
                                className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                                value={waitlistForm.year}
                                onChange={e => setWaitlistForm({...waitlistForm, year: e.target.value})}
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-70 mt-4"
                        >
                            {loading ? 'Joining...' : 'Join LNAT Waitlist'}
                        </button>
                     </form>
                 )}

                 {/* WAITLIST SUCCESS */}
                 {!isLaunchEnabled && joinedWaitlist && (
                     <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                         <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                             <CheckCircle className="w-8 h-8" />
                         </div>
                         <h3 className="text-xl font-bold text-gray-900 mb-2">You're on the list!</h3>
                         <p className="text-gray-600">
                             Thanks — we’ll notify you when LNAT Mentor opens.
                         </p>
                         <button 
                            onClick={() => router.push('/')}
                            className="mt-6 text-purple-600 font-semibold hover:text-purple-700"
                         >
                            Return Home
                         </button>
                     </div>
                 )}

                 {/* LIVE MODE (Google Auth) */}
                 {isLaunchEnabled && (
                     <>
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
                     </>
                 )}
             </div>
         </div>
      </div>
    </>
  );
}
