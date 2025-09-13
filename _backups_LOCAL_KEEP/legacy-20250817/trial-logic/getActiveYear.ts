import { useAuth } from '@/lib/supabase/AuthContext';
import { useState, useEffect } from 'react';

export type YearGroup = 'foundation' | 'year1' | 'year2' | 'year3';

export interface TrialStatus {
  trialActive: boolean;
  daysLeft: number;
  primaryYear: YearGroup | null;
  activePreviewYear: YearGroup | null;
  personas: YearGroup[];
}

// Hook to get active year (preview or primary)
export function useActiveYear() {
  const { user, userProfile } = useAuth();
  const [activeYear, setActiveYear] = useState<YearGroup | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchTrialStatus = async () => {
      try {
        const response = await fetch('/api/trial/status', {
          headers: {
            'Authorization': 'Bearer token',
            'x-user-id': user.id
          }
        });

        if (response.ok) {
          const status: TrialStatus = await response.json();
          setTrialStatus(status);
          
          // Set active year (preview takes precedence if trial is active)
          const effectiveYear = (status.trialActive && status.activePreviewYear) 
            ? status.activePreviewYear 
            : status.primaryYear;
            
          setActiveYear(effectiveYear);
        } else {
          // Fallback to profile data
          const primaryYear = userProfile?.academic_year || userProfile?.user_type || userProfile?.year_group;
          setActiveYear(primaryYear as YearGroup);
        }
      } catch (error) {
        console.error('Failed to fetch trial status:', error);
        // Fallback to profile data
        const primaryYear = userProfile?.academic_year || userProfile?.user_type || userProfile?.year_group;
        setActiveYear(primaryYear as YearGroup);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrialStatus();
  }, [user, userProfile]);

  const activatePreviewYear = async (yearGroup: YearGroup) => {
    if (!user || !trialStatus?.trialActive) return false;

    try {
      // First create persona
      await fetch('/api/trial/persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ year_group: yearGroup })
      });

      // Then activate preview
      const response = await fetch('/api/trial/activateYear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ year_group: yearGroup })
      });

      if (response.ok) {
        setActiveYear(yearGroup);
        if (trialStatus) {
          setTrialStatus({
            ...trialStatus,
            activePreviewYear: yearGroup,
            personas: [...new Set([...trialStatus.personas, yearGroup])]
          });
        }
        return true;
      }
    } catch (error) {
      console.error('Failed to activate preview year:', error);
    }
    return false;
  };

  const clearPreview = async () => {
    if (!user) return false;

    try {
      const response = await fetch('/api/trial/clear', {
        method: 'POST',
        headers: {
          'x-user-id': user.id
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActiveYear(data.activeYear);
        if (trialStatus) {
          setTrialStatus({
            ...trialStatus,
            activePreviewYear: null
          });
        }
        return true;
      }
    } catch (error) {
      console.error('Failed to clear preview:', error);
    }
    return false;
  };

  return {
    activeYear,
    trialStatus,
    isLoading,
    activatePreviewYear,
    clearPreview,
    isPreviewActive: trialStatus?.trialActive && trialStatus?.activePreviewYear !== null
  };
}

// Server-side helper
export function getActiveYearFromCookie(req: any, userProfile: any): YearGroup {
  const previewYear = req.cookies?.preview_year;
  
  // Check if trial is still active (basic check)
  const trialExpiresAt = userProfile?.trial_expires_at ? new Date(userProfile.trial_expires_at) : null;
  const trialActive = trialExpiresAt ? new Date() < trialExpiresAt : false;
  
  // Return preview year if trial active, otherwise primary year
  if (trialActive && previewYear && ['foundation', 'year1', 'year2', 'year3'].includes(previewYear)) {
    return previewYear as YearGroup;
  }
  
  return (userProfile?.academic_year || userProfile?.user_type || userProfile?.year_group || 'foundation') as YearGroup;
}