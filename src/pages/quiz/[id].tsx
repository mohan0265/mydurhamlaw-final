import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { QuizSessionUI } from '@/components/quiz/QuizSessionUI';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { generateSEOTags } from '@/lib/seo';

export default function QuizSessionPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!router.isReady || !user || !id) return;

    const fetchSession = async () => {
      const supabase = getSupabaseClient();
      try {
        const { data, error: sessionError } = await supabase
          .from('quiz_sessions')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (sessionError) throw sessionError;
        setSession(data);
      } catch (err: any) {
        console.error('Failed to fetch session:', err);
        setError(err.message || 'Session not found');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router.isReady, user, id]);

  const seo = generateSEOTags({
    title: 'Quiz Me Session - Speak Law',
    description: 'Active legal practice session with Durmah.',
    canonical: `/quiz/${id}`
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 border border-red-100 shadow-xl text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Error</h1>
          <p className="text-gray-600 mb-8">{error || 'This session is no longer available.'}</p>
          <button 
            onClick={() => router.push('/quiz')}
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Head>
      <div className="min-h-screen bg-white flex flex-col">
        <QuizSessionUI 
          sessionId={session.id} 
          userId={user?.id!} 
          mode={session.mode || 'text'}
        />
      </div>
    </>
  );
}
