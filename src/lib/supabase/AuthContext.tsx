'use client';

import React, { createContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from './client';

type AuthValue = { 
  user: User | null; 
  session: Session | null; 
  loading: boolean; 
  supabase: any | null;
  // Legacy properties for backward compatibility
  isLoading?: boolean;
  userProfile?: any;
  userType?: string;
  getDashboardRoute: () => string;
  realAcademicYear?: any;
};

export const AuthContext = createContext<AuthValue>({ user: null, session: null, loading: true, supabase: null, getDashboardRoute: () => '/signup', realAcademicYear: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<AuthValue>({ 
    user: null, 
    session: null, 
    loading: true, 
    supabase: null,
    getDashboardRoute: () => '/dashboard',
    realAcademicYear: 2024
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { 
      setValue({ 
        user: null, 
        session: null, 
        loading: false, 
        supabase: null,
        isLoading: false,
        userProfile: null,
        userType: undefined,
        getDashboardRoute: () => '/signup',
        realAcademicYear: 2024
      }); 
      return; 
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setValue({ 
        user: session?.user ?? null, 
        session: session ?? null, 
        loading: false, 
        supabase,
        isLoading: false,
        userProfile: null,
        userType: undefined,
        getDashboardRoute: () => session?.user ? '/dashboard' : '/signup',
        realAcademicYear: 2024
      });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setValue((prev) => ({ 
        ...prev, 
        user: session?.user ?? null, 
        session: session ?? null,
        getDashboardRoute: () => session?.user ? '/dashboard' : '/signup',
        realAcademicYear: prev.realAcademicYear
      }));
    });

    return () => { data.subscription.unsubscribe(); };
  }, []);

  const memo = useMemo(() => value, [value]);
  return <AuthContext.Provider value={memo}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

// Legacy hook for backward compatibility during transition
export const useAuth = () => React.useContext(AuthContext);

// Additional legacy hooks for lounge components
export const useSupabaseClient = () => {
  const context = React.useContext(AuthContext);
  return context.supabase;
};

export const useUser = () => {
  const context = React.useContext(AuthContext);
  return context.user;
};