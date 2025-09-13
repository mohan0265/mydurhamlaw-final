// src/pages/auth/redirect.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabase/client';

type SignupPayload = {
  yg?: 'foundation' | 'year1' | 'year2' | 'year3';
  dn?: string;
  at?: boolean;
  src?: string;
};

export default function AuthRedirect() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [status, setStatus] = useState<'working'|'done'|'error'>('working');

  // Parse ?signup_data=... (JSON-encoded)
  const urlSignup = useMemo<Partial<SignupPayload>>(() => {
    try {
      const raw = router.asPath.split('?')[1] || '';
      const params = new URLSearchParams(raw);
      const enc = params.get('signup_data');
      if (!enc) return {};
      return JSON.parse(decodeURIComponent(enc));
    } catch {
      return {};
    }
  }, [router.asPath]);

  // Fallback to local/session storage if URL param missing
  const localSignup = useMemo<Partial<SignupPayload>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const s1 = sessionStorage.getItem('durham_signup_metadata');
      if (s1) return JSON.parse(s1);
    } catch {}
    try {
      const s2 = localStorage.getItem('durham_signup_metadata');
      if (s2) return JSON.parse(s2);
    } catch {}
    return {};
  }, []);

  useEffect(() => {
    if (!supabase) return;

    (async () => {
      try {
        // Ensure we have a session & user
        const [{ data: sessionRes }, { data: userRes }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);

        const user = userRes?.user ?? sessionRes?.session?.user ?? null;
        if (!user) {
          setStatus('error');
          // No session – go to login
          router.replace('/login');
          return;
        }

        // Pick values in priority: URL -> local/session -> nothing
        const yg = (urlSignup.yg ??
                   (localSignup as any).year_group ??
                   localSignup.yg) as SignupPayload['yg'] | undefined;

        const dn = (urlSignup.dn ??
                   (localSignup as any).display_name ??
                   localSignup.dn) as string | undefined;

        const at = (typeof urlSignup.at === 'boolean'
          ? urlSignup.at
          : (localSignup as any).agreed_to_terms ?? false) as boolean;

        // Upsert the profile. We DO NOT force a default year_group.
        // If yg is undefined, we leave it null and your UI can prompt to complete profile.
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            display_name: (dn ?? '').trim() || user.user_metadata?.full_name || null,
            year_group: yg ?? null,
            agreed_to_terms: !!at,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

        // Optionally auto-activate pending loved-one links on first login (safe no-op for students)
        try { await supabase.rpc('awy_activate_loved_one_on_login'); } catch {}

        setStatus('done');
        router.replace('/dashboard');
      } catch (e) {
        setStatus('error');
        router.replace('/login');
      }
    })();
  }, [supabase, router, urlSignup, localSignup]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      {status === 'working' ? 'Finishing sign-in…' : null}
    </div>
  );
}
