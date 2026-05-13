'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: p } = await supabase.from('profiles').select('full_name,role,avatar_url').eq('id', user.id).single();
        setProfile(p);
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
        setUnread(count ?? 0);
      }
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) init(); else { setUser(null); setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setMenuOpen(false);
    router.push('/login'); router.refresh();
  };

  const roleLink = profile?.role === 'admin' ? { href: '/admin', label: '⚙️ Admin Panel' }
    : profile?.role === 'shop_owner' ? { href: '/shop', label: '🏪 My Shop' }
    : profile?.role === 'delivery' ? { href: '/delivery', label: '🛵 Deliveries' } : null;

  return (
    <header className="bg-orange-500 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
      <Link href="/" className="text-xl font-bold">NIKATO</Link>
      <div className="flex items-center gap-2">
        <Link href="/shops" className="hidden sm:block text-sm bg-white text-orange-500 px-3 py-1.5 rounded-full font-semibold">Browse shops</Link>
        {user ? (
          <div className="relative flex items-center gap-2">
            <Link href="/notifications" className="relative p-2 hover:bg-orange-600 rounded-full">
              🔔{unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-full">
              <span className="text-sm font-semibold">{profile?.full_name ? profile.full_name.split(' ')[0] : '👤'}</span>
              <span className="text-xs">▾</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-2xl z-50 text-gray-800 overflow-hidden border">
                <div className="px-4 py-3 bg-orange-50 border-b">
                  <p className="font-semibold text-sm">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-400">{user.phone ?? user.email}</p>
                  <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full capitalize">{profile?.role ?? 'customer'}</span>
                </div>
                {roleLink && <Link href={roleLink.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-orange-600 hover:bg-orange-50 border-b">{roleLink.label}</Link>}
                <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50">📦 My Orders</Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50">👤 My Profile</Link>
                <Link href="/profile/addresses" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50">📍 Addresses</Link>
                <Link href="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 border-b">🔔 Notifications {unread > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-1.5 rounded-full">{unread}</span>}</Link>
                <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50">🚪 Logout</button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="text-sm bg-white text-orange-500 px-3 py-1.5 rounded-full font-semibold">Login</Link>
        )}
      </div>
    </header>
  );
}
