'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Users,
  Bike,
  BarChart2,
  Percent,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase/client';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/shops', label: 'Shops', icon: Store },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/delivery-partners', label: 'Delivery Partners', icon: Bike },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/commissions', label: 'Commissions', icon: Percent },
  { divider: true, label: 'Create', href: '', icon: PlusCircle },
  { href: '/admin/create-shop', label: 'Create Shop', icon: Store },
  { href: '/admin/create-delivery', label: 'Create Delivery', icon: Bike },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const { reset: resetAuth } = useAuthStore();

  async function handleSignOut() {
    await supabase.auth.signOut();
    resetAuth();
  }

  function isActive(item: { href: string; exact?: boolean }) {
    if (!item.href) return false;
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF6B35] flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">NIKATO Admin</p>
            <p className="text-white/50 text-xs">Control Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item, i) => {
          if ((item as { divider?: boolean }).divider) {
            return (
              <p key={i} className="px-3 pt-4 pb-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                {item.label}
              </p>
            );
          }
          const active = isActive(item as { href: string; exact?: boolean });
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
              {item.label}
            </Link>
          );
        })}
      </nav>

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
      <aside className="hidden lg:flex flex-col w-64 bg-[#1A1A2E] min-h-screen flex-shrink-0">
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#1A1A2E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FF6B35] flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">NIKATO Admin</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-white p-1">
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-[#1A1A2E] flex flex-col h-full pt-14">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
