/**
 * Custom React hook for authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import type { User } from '@supabase/supabase-js';

export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to check session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen to auth changes
    const subscription = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { user: signedInUser, error } = await authService.signIn(email, password);
    if (signedInUser) {
      setUser(signedInUser);
    }
    setIsLoading(false);
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { user: signedUpUser, error } = await authService.signUp(email, password);
    if (signedUpUser) {
      setUser(signedUpUser);
    }
    setIsLoading(false);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    const { error } = await authService.signOut();
    if (!error) {
      setUser(null);
    }
    setIsLoading(false);
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return await authService.resetPassword(email);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}

export default useAuth;
