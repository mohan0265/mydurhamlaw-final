// src/hooks/useStudentOnly.ts
// Hook to protect student-only pages from loved ones

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * Hook that checks if the current user is a loved one and redirects them
 * to the loved-one-dashboard if so.
 * 
 * @returns isChecking - true while checking, false when done
 * @returns isLovedOne - true if user is a loved one (will be redirected)
 */
export function useStudentOnly(): { isChecking: boolean; isLovedOne: boolean } {
  const { user, loading } = useAuth() || { user: null, loading: true };
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isLovedOne, setIsLovedOne] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (loading) return;
      
      if (!user) {
        setIsChecking(false);
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        setIsChecking(false);
        return;
      }

      try {
        // Check profile's user_role
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.user_role === 'loved_one') {
          console.log('[useStudentOnly] Loved one detected, redirecting...');
          setIsLovedOne(true);
          router.replace('/loved-one-dashboard');
          return;
        }

        // Also check awy_connections by email
        if (user.email) {
          const { data: conn } = await supabase
            .from('awy_connections')
            .select('id')
            .ilike('loved_email', user.email)
            .in('status', ['active', 'accepted', 'granted'])
            .limit(1)
            .maybeSingle();

          if (conn) {
            console.log('[useStudentOnly] Loved one (by email) detected, redirecting...');
            setIsLovedOne(true);
            router.replace('/loved-one-dashboard');
            return;
          }
        }

        // User is a student - allow access
        setIsChecking(false);
      } catch (err) {
        console.warn('[useStudentOnly] Role check error:', err);
        setIsChecking(false);
      }
    };

    checkRole();
  }, [user, loading, router]);

  return { isChecking, isLovedOne };
}
