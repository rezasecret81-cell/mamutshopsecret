import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = useRef<string | null>(null);

  const loadProfile = async (userId: string) => {
    if (currentUserId.current === userId && profile !== null) return;
    currentUserId.current = userId;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('loadProfile error:', error.message);
      return;
    }
    setProfile(data as Profile | null);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session: existingSession }, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        setLoading(false);
        return;
      }

      setSession(existingSession);

      if (existingSession?.user) {
        await loadProfile(existingSession.user.id);
      }

      if (mounted) setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (event === 'SIGNED_OUT' || !newSession?.user) {
        currentUserId.current = null;
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (event === 'SIGNED_IN') {
          setLoading(true);
        }
        loadProfile(newSession.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else if (event === 'TOKEN_REFRESHED') {
        loadProfile(newSession.user.id);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isAdmin: profile?.is_admin ?? false,
      refreshProfile: async () => {
        if (session?.user) {
          currentUserId.current = null;
          await loadProfile(session.user.id);
        }
      },
      signOut: async () => {
        currentUserId.current = null;
        setProfile(null);
        setSession(null);
        setLoading(false);
        await supabase.auth.signOut();
      },
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
