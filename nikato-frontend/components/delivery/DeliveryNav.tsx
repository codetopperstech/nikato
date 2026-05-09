'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, Clock, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/delivery', label: 'Home', icon: Home, exact: true },
  { href: '/delivery/orders', label: 'Available', icon: List },
  { href: '/delivery/history', label: 'History', icon: Clock },
  { href: '/delivery/earnings', label: 'Earnings', icon: Wallet },
  { href: '/delivery/profile', label: 'Profile', icon: User },
];

export function DeliveryNav() {
  const pathname = usePathname();

  function isActive(item: { href: string; exact?: boolean }) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors',
                active ? 'text-[#FF6B35]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
