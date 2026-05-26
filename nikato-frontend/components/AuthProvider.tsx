'use client';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore, type Profile } from '@/store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setLoading } = useAuthStore();
  // ✅ Guard: only process the FIRST auth event to prevent race condition
  const initialized = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(userId: string) {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (mounted) setProfile((data as Profile) ?? null); // setProfile also sets isLoading=false
    }

    // ✅ getSession FIRST — then subscribe
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      initialized.current = true;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false); // ✅ No user — stop loading immediately
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      // ✅ Skip first event if getSession already handled it
      if (!initialized.current) { initialized.current = true; }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null); // setProfile sets isLoading=false
        setLoading(false);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []); // ✅ Empty deps — run once only, no re-subscription loops

  return <>{children}</>;
}
