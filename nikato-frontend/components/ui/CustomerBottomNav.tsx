'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, Package, User } from 'lucide-react';
import { useCartStore } from '@/store/cart';

const PANEL_PREFIXES = ['/admin', '/shop', '/delivery', '/login', '/otp'];

const NAV_ITEMS = [
  { href: '/',          label: 'Home',    Icon: Home },
  { href: '/search',    label: 'Search',  Icon: Search },
  { href: '/cart',      label: 'Cart',    Icon: ShoppingBag },
  { href: '/orders',    label: 'Orders',  Icon: Package },
  { href: '/profile',   label: 'Profile', Icon: User },
];

export default function CustomerBottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore(s => s.itemCount)();

  // Don't show on panel routes
  if (PANEL_PREFIXES.some(p => pathname.startsWith(p))) return null;

  return (
    <nav className="bottom-nav md:hidden">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isCart = href === '/cart';
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
            <div className="relative">
              <Icon size={22} />
              {isCart && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: '#7ED957' }}>
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
