'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/shops', label: 'Shops', icon: '🏪' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/delivery-partners', label: 'Delivery Partners', icon: '🛵' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/commissions', label: 'Commissions', icon: '💰' },
  { href: '/admin/create-shop', label: 'Create Shop', icon: '🏪➕' },
  { href: '/admin/create-delivery', label: 'Create Delivery', icon: '🛵➕' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">⚙️</div>
        <p className="text-orange-500 font-semibold">Loading Admin Panel...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-gray-900 text-white flex flex-col flex-shrink-0 fixed top-0 left-0 h-full z-40">
        <div className="p-4 border-b border-gray-700">
          <span className="font-bold text-orange-400 text-lg">NIKATO Admin</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                pathname === item.href
                  ? 'bg-orange-500 text-white font-semibold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
            <span>🏠</span>
            <span>Back to App</span>
          </Link>
        </div>
      </aside>
      <main className="flex-1 ml-56 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
