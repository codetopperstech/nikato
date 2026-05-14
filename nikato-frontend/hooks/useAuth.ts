'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type Profile } from '@/store/auth';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  role: string | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth(requiredRole?: string): AuthState {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (requiredRole && role !== requiredRole) router.replace('/unauthorized');
  }, [isLoading, user, role, requiredRole, router]);

  return { user, role, profile, loading: isLoading };
}
