// ============================================================
// NIKATO — store/auth.ts
// Auth state: user, session, role, loading
// Blueprint Section 17: State Management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setSession: (session) =>
        set({ session, isAuthenticated: !!session }),

      setProfile: (profile) =>
        set({
          profile,
          role: profile?.role ?? null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      reset: () => set(initialState),
    }),
    {
      name: 'nikato-auth',
      // Only persist non-sensitive fields
      partialize: (state) => ({
        profile: state.profile,
        role: state.role,
      }),
    }
  )
);
