import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Brain, FileText, BarChart, BookOpen, LogOut } from 'lucide-react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useEntitlements } from '@/components/auth/EntitlementGuards';

export default function LnatDashboard() { 
  const isLaunchEnabled = process.env.NEXT_PUBLIC_LNAT_LAUNCH_ENABLED === 'true';
  const router = useRouter();
  
  // UPCOMING GATE
  if (!isLaunchEnabled) {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
             <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-gray-100">
                 <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-xl mb-6">
                     <Brain className="w-6 h-6" />
                 </div>
                 <h1 className="text-2xl font-black text-gray-900 mb-2">LNAT Mentor is Coming Soon</h1>
                 <p className="text-gray-600 mb-8">
                    We are currently in private development. Join the waitlist to be notified when early access opens.
                 </p>
                 <button 
                    onClick={() => router.push('/lnat/signup')}
                    className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-purple-700 transition"
                 >
                    Join Waitlist
                 </button>
             </div>
          </div>
      );
  }

  const { hasLnatAccess, loading: entitlementsLoading } = useEntitlements();
  const user = useUser();
  const supabase = useSupabaseClient();
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Basic check - usually middleware handles this protection
    if (!user) {
        // Wait for auth to load or redirect
        const timer = setTimeout(() => {
             if (!user) router.replace('/lnat/signup'); 
        }, 1000); // reduced flash
        return () => clearTimeout(timer);
    }
    setAuthLoading(false);
  }, [user, router]);

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      router.push('/');
  };

  if (authLoading) return null;

  return (
    <>
      <Head>
        <title>LNAT Mentor | Dashboard</title>
      </Head>
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* LNAT Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
               <div className="flex items-center gap-2">
                   <Brain className="w-6 h-6 text-purple-600" />
                   <span className="font-bold text-gray-900 tracking-tight">LNAT Mentor</span>
                   <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider">Trial</span>
               </div>
               <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-500 hover:text-gray-900">
                     <LogOut className="w-4 h-4 mr-2" />
                     Sign Out
                  </Button>
               </div>
           </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-12">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome to LNAT Mentor.</h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                    Master the LNAT format. Develop critical reasoning. Write clear arguments.
                    <br/><span className="text-sm text-gray-400 mt-1 block">(Text-mode only. Voice coaching checks are disabled in Trial.)</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {/* Available Guides */}
                <div onClick={() => router.push('/lnat-preparation')} className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center mb-4">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Preparation Guides</h3>
                    <p className="text-sm text-gray-500">Read our foundational guides on LNAT strategy.</p>
                </div>

                {/* Coming Soon Features */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300 opacity-75">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 text-gray-400 flex items-center justify-center mb-4">
                        <BarChart className="w-5 h-5" />
                    </div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-500 mb-2">Diagnostic Test</h3>
                        <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded">Soon</span>
                    </div>
                    <p className="text-sm text-gray-400">Assess your current baseline score.</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300 opacity-75">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 text-gray-400 flex items-center justify-center mb-4">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-500 mb-2">Essay Planner</h3>
                        <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded">Soon</span>
                    </div>
                    <p className="text-sm text-gray-400">Structure your Section B essays.</p>
                </div>
            </div>

            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-4">Unlock Full Access</h2>
                <p className="text-gray-400 mb-6 max-w-lg mx-auto">Get unlimited practice questions, full essay grading, and voice logic drills.</p>
                <Button className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 py-3 rounded-full" onClick={() => router.push('/lnat/pricing')}>
                    View Plans
                </Button>
            </div>
        </main>
      </div>
    </>
  );
}
