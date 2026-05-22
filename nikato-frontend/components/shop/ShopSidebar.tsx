'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Tag, ShoppingBag, BarChart2, Wallet, Settings, ChevronRight, ArrowLeft } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/shop',            icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/shop/orders',     icon: ShoppingBag,     label: 'Orders' },
  { href: '/shop/products',   icon: Package,         label: 'Products' },
  { href: '/shop/categories', icon: Tag,             label: 'Categories' },
  { href: '/shop/analytics',  icon: BarChart2,       label: 'Analytics' },
  { href: '/shop/earnings',   icon: Wallet,          label: 'Earnings' },
  { href: '/shop/settings',   icon: Settings,        label: 'Settings' },
];

export function ShopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { shopData, pendingOrders } = useShopStore();

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#7ED957' }}>
          <span className="text-white text-xs font-black">N</span>
        </div>
        <span className="font-black text-gray-900 flex-1 truncate">{shopData?.name || 'Shop'}</span>
        <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-none">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/shop' && pathname.startsWith(href));
            const count = label === 'Orders' && pendingOrders.length > 0 ? pendingOrders.length : null;
            return (
              <Link key={href} href={href} className={cn('relative flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all', active ? 'text-white' : 'text-gray-500')} style={active ? { background: '#7ED957' } : {}}>
                <Icon size={13} />{label}
                {count && <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1">{count}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white border-r border-gray-100 sticky top-0 h-screen">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#7ED957' }}>
              <span className="text-white text-xs font-black">N</span>
            </div>
            <span className="font-black text-gray-900 text-sm">nikato shop</span>
          </div>
          <div className="bg-surface-2 rounded-xl p-2.5">
            <p className="font-bold text-xs text-gray-900 truncate">{shopData?.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{shopData?.city}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/shop' && pathname.startsWith(href));
            const count = label === 'Orders' && pendingOrders.length > 0 ? pendingOrders.length : null;
            return (
              <Link key={href} href={href}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all', active ? 'text-white' : 'text-gray-600 hover:bg-surface-2 hover:text-gray-900')}
                style={active ? { background: '#7ED957' } : {}}>
                <Icon size={16} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {count && <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">{count}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-surface-2 transition-colors">
            <ArrowLeft size={16} />Back to app
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
            <ChevronRight size={16} className="rotate-180" />Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
