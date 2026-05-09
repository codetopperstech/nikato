'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  BarChart2,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { useShopStore } from '@/store/shop';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase/client';

const NAV = [
  { href: '/shop', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/shop/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/shop/products', label: 'Products', icon: Package },
  { href: '/shop/categories', label: 'Categories', icon: Tag },
  { href: '/shop/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/shop/earnings', label: 'Earnings', icon: Wallet },
  { href: '/shop/settings', label: 'Settings', icon: Settings },
];

export function ShopSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const { shopData, pendingOrders } = useShopStore();
  const { reset: resetAuth } = useAuthStore();

  async function handleSignOut() {
    await supabase.auth.signOut();
    resetAuth();
  }

  function isActive(item: { href: string; exact?: boolean }) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF6B35] flex items-center justify-center">
            <Store size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">
              {shopData?.name ?? 'My Shop'}
            </p>
            <p className="text-white/50 text-xs">Shop Owner</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = isActive(item);
          const showBadge = item.href === '/shop/orders' && pendingOrders.length > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-[#FF6B35] text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="bg-white text-[#FF6B35] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingOrders.length > 9 ? '9+' : pendingOrders.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1A1A2E] min-h-screen flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#1A1A2E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FF6B35] flex items-center justify-center">
            <Store size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">{shopData?.name ?? 'My Shop'}</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="text-white p-1"
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-[#1A1A2E] flex flex-col h-full pt-14">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
