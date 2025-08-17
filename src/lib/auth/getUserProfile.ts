import { getSupabaseClient } from '../supabase/client';

export interface UserProfile {
  id: string;
  email?: string;
  academic_year: 'foundation' | 'year_1' | 'year_2' | 'year_3';
  trial_ends_at: string;
  can_preview_years: boolean;
  user_type?: string; // Legacy field for compatibility
  year_group?: string; // Legacy field for compatibility
  onboarding_status?: string;
  onboarding_progress?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SessionAndProfile {
  session: any | null;
  profile: UserProfile | null;
  error?: any;
}

/**
 * Get the current user session and profile with trial information
 */
export async function getSessionAndProfile(): Promise<SessionAndProfile> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { session: null, profile: null, error: new Error('No Supabase client available') };
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { session: null, profile: null, error: sessionError };
    }

    if (!session?.user) {
      return { session: null, profile: null };
    }

    // Get user profile with trial fields
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        academic_year,
        trial_ends_at,
        can_preview_years,
        user_type,
        year_group,
        onboarding_status,
        onboarding_progress,
        created_at,
        updated_at
      `)
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return { session, profile: null, error: profileError };
    }

    return { session, profile };
  } catch (error) {
    console.error('Error getting session and profile:', error);
    return { session: null, profile: null, error };
  }
}

/**
 * Server-side version for middleware/API routes
 * Requires passing the request for cookie access
 */
export async function getServerSessionAndProfile(req?: any): Promise<SessionAndProfile> {
  // For now, use the same implementation
  // In a real server environment, you'd use createServerComponentClient from @supabase/ssr
  return getSessionAndProfile();
}

/**
 * Check if user is currently in trial period
 */
export function isInTrial(profile: UserProfile): boolean {
  if (!profile.trial_ends_at) return false;
  return new Date() <= new Date(profile.trial_ends_at);
}

/**
 * Check if user can preview other years
 */
export function canPreviewYears(profile: UserProfile): boolean {
  return profile.can_preview_years && isInTrial(profile);
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(profile: UserProfile): number {
  if (!profile.trial_ends_at) return 0;
  const now = new Date();
  const trialEnd = new Date(profile.trial_ends_at);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}