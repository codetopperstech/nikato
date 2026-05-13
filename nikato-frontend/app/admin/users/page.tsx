'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('profiles')
      .select('id, phone, full_name, role, is_active, created_at, avatar_url')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data) setUsers(data);
        if (error) console.error(error);
        setLoading(false);
      });
  }, []);

  const filtered = users.filter(u =>
    u.phone?.includes(search) || u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor: Record<string, string> = {
    customer: 'bg-blue-100 text-blue-700',
    shop_owner: 'bg-orange-100 text-orange-700',
    delivery: 'bg-green-100 text-green-700',
    admin: 'bg-purple-100 text-purple-700',
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', id);
    setUsers(u => u.map(x => x.id === id ? { ...x, is_active: !current } : x));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">All Users</h1>
          <p className="text-gray-400 text-sm">{users.length} total users</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by phone or name..."
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 w-64" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-orange-500 animate-pulse">Loading users...</div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-3">👥</div>
              <p>No users found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(u => (
                <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-lg font-bold text-orange-500">
                      {u.full_name ? u.full_name[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{u.full_name || 'No name'}</p>
                      <p className="text-xs text-gray-400">{u.phone}</p>
                      <p className="text-xs text-gray-300">{new Date(u.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColor[u.role] || 'bg-gray-100'}`}>
                      {u.role}
                    </span>
                    <button onClick={() => toggleActive(u.id, u.is_active)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${u.is_active ? 'bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-600' : 'bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-600'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
