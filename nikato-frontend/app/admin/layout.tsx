'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Spinner } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      router.replace('/unauthorized');
    }
  }, [authLoading, user, role, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <Spinner size="lg" className="text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
