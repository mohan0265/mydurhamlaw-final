import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { QuizSessionUI } from '@/components/quiz/QuizSessionUI';
import { Loader2, AlertCircle } from 'lucide-react';
import { generateSEOTags } from '@/lib/seo';

export default function QuizPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !user) return;

    const initQuiz = async () => {
      const supabase = getSupabaseClient();
      const { module, lecture, mode } = router.query;

      try {
        // Attempt to create a new session
        const { data: session, error: sessionError } = await supabase
          .from('quiz_sessions')
          .insert({
            user_id: user.id,
            module_code: module as string || null,
            quiz_type: lecture ? 'lecture' : module ? 'module' : 'general',
            target_id: lecture as string || null,
            status: 'active'
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        setSessionId(session.id);
      } catch (err: any) {
        console.error('Failed to init quiz session:', err);
        setError(err.message || 'Failed to start quiz session');
      } finally {
        setLoading(false);
      }
    };

    initQuiz();
  }, [router.isReady, user, router.query]);

  const seo = generateSEOTags({
    title: 'Quiz Me - Practice Speaking Law',
    description: 'A grounded, authentic practice environment for Durham Law students.',
    canonical: '/study/quiz'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Preparing your Durmah quiz session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Initialization Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl"
          >
            Back to Dashboard
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
          {sessionId && (
            <QuizSessionUI 
              sessionId={sessionId} 
              userId={user?.id!} 
              mode={(router.query.mode as 'text' | 'voice') || 'text'}
            />
          )}
      </div>
    </>
  );
}
