'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-orange-500 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
      <Link href="/" className="text-xl font-bold tracking-tight">NIKATO</Link>
      <div className="flex items-center gap-3">
        <Link href="/shops" className="text-sm bg-white text-orange-500 px-3 py-1.5 rounded-full font-semibold hover:bg-orange-50 transition">
          Browse shops
        </Link>
        {user ? (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="text-sm bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-full font-semibold transition">
              👤 Account
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl z-50 text-gray-800 overflow-hidden border">
                <div className="px-4 py-3 bg-orange-50 border-b">
                  <p className="text-xs text-gray-400">Logged in as</p>
                  <p className="text-sm font-semibold truncate">{user.phone ?? user.email}</p>
                </div>
                <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition">
                  📦 My Orders
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition">
                  👤 My Profile
                </Link>
                <Link href="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition">
                  🔔 Notifications
                </Link>
                <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 border-t transition">
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="text-sm bg-white text-orange-500 px-3 py-1.5 rounded-full font-semibold hover:bg-orange-50 transition">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
