'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './client';

interface SupabaseContextState {
  user: User | null;
  session: Session | null;
  isUserLoading: boolean;
  userError: Error | null;
}

const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // SINGLE auth bootstrap
    const initAuth = async () => {
      // Create a timeout promise
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ error: new Error('Auth timeout') }), 3000);
      });

      // Race between actual auth and timeout
      const authPromise = supabase.auth.getSession();

      try {
        const result: any = await Promise.race([authPromise, timeoutPromise]);

        if (!mounted) return;

        if (result?.error && result.error.message !== 'Auth timeout') {
          console.error('Auth session error:', result.error);
          setUserError(result.error);
        } else if (result?.data?.session) {
          setSession(result.data.session);
          setUser(result.data.session.user ?? null);
        }
      } catch (err) {
        console.warn("Auth initialization failed", err);
      } finally {
        if (mounted) setIsUserLoading(false);
      }
    };

    initAuth();

    // SINGLE auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsUserLoading(false);
      setUserError(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider
      value={{
        user,
        session,
        isUserLoading,
        userError,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = (): SupabaseContextState => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return ctx;
};

export const useAuth = () => useSupabase();

