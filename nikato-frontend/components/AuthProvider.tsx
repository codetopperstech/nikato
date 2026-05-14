'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore, type Profile } from '@/store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function loadUser(userId: string) {
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', userId).single();
      if (mounted) setProfile((profile as Profile) ?? null);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadUser(session.user.id);
      else { setLoading(false); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadUser(session.user.id);
      else { setProfile(null); }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [setUser, setSession, setProfile, setLoading]);

  return <>{children}</>;
}
