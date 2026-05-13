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
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-orange-500 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-50">
      <Link href="/" className="text-xl font-bold">NIKATO</Link>
      
      <div className="flex items-center gap-3">
        <Link href="/shops" className="text-sm bg-white text-orange-500 px-3 py-1 rounded-full font-semibold">
          Browse shops
        </Link>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-sm bg-orange-600 px-3 py-1 rounded-full font-semibold"
            >
              👤 Account
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-50 text-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <p className="text-xs text-gray-400">Logged in</p>
                  <p className="text-sm font-semibold truncate">{user.phone}</p>
                </div>
                <Link href="/orders" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm hover:bg-gray-50">
                  📦 My Orders
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm hover:bg-gray-50">
                  👤 My Profile
                </Link>
                <Link href="/notifications" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm hover:bg-gray-50">
                  🔔 Notifications
                </Link>
                <button onClick={logout}
                  className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 border-t">
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login"
            className="text-sm bg-white text-orange-500 px-3 py-1 rounded-full font-semibold">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
