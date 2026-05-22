'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, BarChart2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/delivery',         icon: Home,     label: 'Home' },
  { href: '/delivery/orders',  icon: Package,  label: 'Orders' },
  { href: '/delivery/earnings',icon: BarChart2, label: 'Earnings' },
  { href: '/delivery/profile', icon: User,     label: 'Profile' },
];

export function DeliveryNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 pb-safe" style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}>
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/delivery' && pathname.startsWith(href));
        return (
          <Link key={href} href={href} className={cn('flex-1 flex flex-col items-center gap-1 py-3 transition-all', active ? '' : 'text-gray-400 hover:text-gray-600')}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} style={active ? { color: '#5cb83a' } : {}} />
            <span className={cn('text-[10px] font-semibold', active ? '' : '')} style={active ? { color: '#5cb83a' } : {}}>{label}</span>
            {active && <div className="absolute bottom-0 w-8 h-0.5 rounded-full" style={{ background: '#7ED957' }} />}
          </Link>
        );
      })}
    </nav>
  );
}
