'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Search, Bell, ChevronDown, Settings, Package, MapPin, LogOut, Store, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const router = useRouter();
  const itemCount = useCartStore(s => s.itemCount)();

  useEffect(() => {
    const init = async (sessionUser: any) => {
      if (sessionUser) {
        setUser(sessionUser);
        const { data: p } = await supabase.from('profiles').select('full_name,role,avatar_url').eq('id', sessionUser.id).single();
        setProfile(p);
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', sessionUser.id).eq('is_read', false);
        setUnread(count ?? 0);
      } else { setUser(null); setProfile(null); }
      setAuthReady(true);
    };
    supabase.auth.getSession().then(({ data: { session } }) => init(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => init(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); setMenuOpen(false); router.push('/'); router.refresh(); };

  const roleLink = profile?.role === 'admin' ? { href: '/admin', label: 'Admin Panel', Icon: Settings }
    : profile?.role === 'shop_owner' ? { href: '/shop', label: 'My Shop', Icon: Store }
    : profile?.role === 'delivery' ? { href: '/delivery', label: 'Deliveries', Icon: Truck } : null;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#7ED957' }}>
            <span className="text-white text-xs font-black">N</span>
          </div>
          <span className="text-base font-black text-gray-900 tracking-tight">nikato</span>
        </Link>

        {/* Search bar — shrinks on small screens, never pushes icons */}
        <Link href="/search" className="flex-1 min-w-0 max-w-xs">
          <div className="flex items-center gap-2 bg-surface-2 rounded-xl px-3 py-2 text-sm text-gray-400 hover:bg-gray-100 transition-colors min-w-0">
            <Search size={14} className="flex-shrink-0" />
            <span className="truncate hidden sm:inline">Search products…</span>
            <span className="truncate sm:hidden">Search…</span>
          </div>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Cart */}
          <Link href="/cart" className="relative p-2 rounded-xl hover:bg-surface-2 transition-colors">
            <ShoppingBag size={20} className="text-gray-600" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pop-in" style={{ background: '#7ED957' }}>
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          {!authReady ? (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <div className="relative">
              {/* Notification dot */}
              {unread > 0 && (
                <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-surface-2 transition-colors mr-0.5">
                  <Bell size={20} className="text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                </Link>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-1.5 pl-2 pr-1 py-1.5 rounded-xl hover:bg-surface-2 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#7ED957' }}>
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : '?'}
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 bg-surface-2 border-b border-gray-100">
                      <p className="font-bold text-sm text-gray-900">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{user.phone ?? user.email}</p>
                    </div>
                    <div className="py-1">
                      {roleLink && (
                        <Link href={roleLink.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 transition-colors" style={{ color: '#5cb83a' }}>
                          <roleLink.Icon size={16} />{roleLink.label}
                        </Link>
                      )}
                      <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-surface-2 transition-colors">
                        <Package size={16} />My Orders
                      </Link>
                      <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-surface-2 transition-colors">
                        <MapPin size={16} />Profile & Addresses
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={16} />Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90" style={{ background: '#7ED957' }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
