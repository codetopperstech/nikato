'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'shop_owner' | 'delivery' | 'admin';

// Matches DB profiles table exactly
export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  fcm_token?: string | null;
  [key: string]: unknown; // allow extra DB columns
}

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, session: null, profile: null, role: null,
      isLoading: true, isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session, isAuthenticated: !!session }),
      setProfile: (profile) => set({ profile, role: (profile?.role as UserRole) ?? null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ user: null, session: null, profile: null, role: null, isLoading: false, isAuthenticated: false }),
    }),
    { name: 'nikato-auth', partialize: (s) => ({ profile: s.profile, role: s.role }) }
  )
);
