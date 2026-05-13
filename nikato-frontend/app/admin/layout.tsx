'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { router.push('/unauthorized'); return; }
      setChecking(false);
    };
    check();
  }, []);

  if (checking) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-orange-500 text-xl animate-pulse">Loading admin panel...</div>
    </div>
  );

  return <>{children}</>;
}
