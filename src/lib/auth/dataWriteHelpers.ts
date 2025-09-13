import { useContext } from 'react';
import { AuthContext } from '@/lib/supabase/AuthContext';
import type { YearKey } from '@/lib/academic/preview';

/**
 * Hook to get the real academic year for data writes
 * This ensures all writes use the user's actual academic year, not preview year
 */
export function useRealAcademicYear(): YearKey | null {
  const { realAcademicYear } = useContext(AuthContext);
  return realAcademicYear;
}

/**
 * Hook to get user context for data writes
 * Always uses real academic year, never preview year
 */
export function useDataWriteContext() {
  const { user, realAcademicYear, userProfile } = useContext(AuthContext);
  
  return {
    userId: user?.id || null,
    realAcademicYear,
    userProfile,
    // Helper to create write metadata
    createMetadata: (additionalData?: Record<string, any>) => ({
      academic_year: realAcademicYear,
      user_id: user?.id,
      created_at: new Date().toISOString(),
      ...additionalData
    })
  };
}

/**
 * Ensure data write includes real academic year
 * This is a utility to wrap any data write operation
 */
export function enrichDataWrite(data: Record<string, any>, realAcademicYear: YearKey | null) {
  return {
    ...data,
    academic_year: realAcademicYear,
    // Add timestamp if not present
    created_at: data.created_at || new Date().toISOString()
  };
}

/**
 * Server-side helper to get real academic year from profile
 * For API routes and server-side operations
 */
export function extractRealAcademicYear(profile: any): YearKey | null {
  return profile?.academic_year || null;
}

/**
 * Validation function to ensure critical data writes have academic year
 */
export function validateDataWrite(data: Record<string, any>, operation: string) {
  if (!data.user_id) {
    throw new Error(`Data write for ${operation} requires user_id`);
  }
  
  // For operations that should be tied to academic year
  const yearRequiredOperations = ['assignment', 'note', 'wellbeing', 'memory'];
  const requiresYear = yearRequiredOperations.some(op => operation.includes(op));
  
  if (requiresYear && !data.academic_year) {
    console.warn(`Data write for ${operation} missing academic_year - this may affect data integrity`);
  }
  
  return true;
}