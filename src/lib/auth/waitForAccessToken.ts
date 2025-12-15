import { getSupabaseClient } from '@/lib/supabase/client';

type WaitOptions = {
  timeoutMs?: number;
};

/**
  * Wait briefly for a Supabase access token to be available.
  * Returns the token string or null if not found before timeout.
  */
export async function waitForAccessToken(
  options: WaitOptions = {}
): Promise<string | null> {
  const timeoutMs = options.timeoutMs ?? 2000;
  const supabase = getSupabaseClient();

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch {
    // fall through to subscription
  }

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (resolved) return;
        if (session?.access_token) {
          resolved = true;
          clearTimeout(timer);
          subscription?.subscription.unsubscribe();
          resolve(session.access_token);
        }
      }
    );
  });
}
