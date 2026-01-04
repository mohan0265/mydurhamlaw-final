'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InviteCallbackPage() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token && typeof token === 'string') {
      acceptInvite(token);
    }
  }, [token]);

  const acceptInvite = async (inviteToken: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error('Authentication not available');
      return;
    }

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Still in OAuth flow, wait a bit
        setTimeout(() => acceptInvite(inviteToken), 1000);
        return;
      }

      // Call accept endpoint
      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: inviteToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to accept invitation');
        router.push('/');
        return;
      }

      toast.success(`Welcome, ${data.displayName}! Your ${data.yearGroup} trial is active.`);
      router.push('/dashboard');

    } catch (error: any) {
      console.error('Accept error:', error);
      toast.error('Failed to complete signup');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium">Creating your account...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}
