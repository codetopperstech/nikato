'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, Store, Users, BarChart2, Percent, Plus, Truck, Settings, ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin',                   icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/orders',            icon: ShoppingBag,     label: 'Orders' },
  { href: '/admin/shops',             icon: Store,           label: 'Shops' },
  { href: '/admin/users',             icon: Users,           label: 'Users' },
  { href: '/admin/delivery-partners', icon: Truck,           label: 'Riders' },
  { href: '/admin/analytics',         icon: BarChart2,       label: 'Analytics' },
  { href: '/admin/commissions',       icon: Percent,         label: 'Commissions' },
];

const ACTIONS = [
  { href: '/admin/create-shop',     icon: Plus,  label: 'Create Shop' },
  { href: '/admin/create-delivery', icon: Plus,  label: 'Add Rider' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      // ✅ Use API route (service_role) to get role — anon client blocked by RLS
      const res = await fetch('/api/auth/me');
      if (!res.ok) { router.replace('/login'); return; }
      const { role } = await res.json();
      if (role !== 'admin') { router.replace('/unauthorized'); return; }
      setLoading(false);
    };
    check();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FBF8' }}>
      <Spinner size="lg" style={{ color: '#7ED957' } as React.CSSProperties} />
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: '#F9FBF8' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 sticky top-0 h-screen">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#7ED957' }}>
              <span className="text-white text-xs font-black">N</span>
            </div>
            <span className="font-black text-gray-900 text-sm">nikato admin</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all', active ? 'text-white' : 'text-gray-600 hover:bg-surface-2')} style={active ? { background: '#7ED957' } : {}}>
                <Icon size={16} className="flex-shrink-0" />{label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-gray-100 mt-2 space-y-0.5">
            {ACTIONS.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all', pathname === href ? 'text-white' : 'text-gray-600 hover:bg-surface-2')} style={pathname === href ? { background: '#7ED957' } : {}}>
                <Icon size={16} className="flex-shrink-0" />{label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-surface-2 transition-colors"><ArrowLeft size={16} />Back to app</Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"><LogOut size={16} />Sign out</button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#7ED957' }}>
          <span className="text-white text-xs font-black">N</span>
        </div>
        <span className="font-black text-gray-900 text-sm flex-shrink-0">Admin</span>
        <div className="flex gap-1 overflow-x-auto">
          {NAV.map(({ href, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={cn('p-2 rounded-xl transition-all', active ? 'text-white' : 'text-gray-400')} style={active ? { background: '#7ED957' } : {}}>
                <Icon size={16} />
              </Link>
            );
          })}
        </div>
      </div>

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
