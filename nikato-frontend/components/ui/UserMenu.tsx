'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function UserMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
      >
        👤 {user?.phone ?? 'Account'}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="text-sm font-semibold truncate">{user?.phone}</p>
          </div>
          <button
            onClick={() => { router.push('/profile'); setOpen(false); }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
          >
            👤 My Profile
          </button>
          <button
            onClick={() => { router.push('/orders'); setOpen(false); }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
          >
            📦 My Orders
          </button>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 border-t"
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}
