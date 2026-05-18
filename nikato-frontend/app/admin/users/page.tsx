'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui';

type UserRow = { id: string; phone: string | null; full_name: string | null; role: string; is_active: boolean; created_at: string };

const ROLE_COLOR: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-700', shop_owner: 'bg-orange-100 text-orange-700',
  delivery: 'bg-green-100 text-green-700', admin: 'bg-purple-100 text-purple-700',
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      return d.users as UserRow[];
    },
    staleTime: 30000,
  });

  const filtered = users.filter(u =>
    !search || u.phone?.includes(search) || u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleActive(id: string, current: boolean) {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !current }) });
    qc.invalidateQueries({ queryKey: ['admin-users'] });
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Users</h1>
          <p className="text-sm text-gray-400">{users.length} total</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone"
            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] w-64" />
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No users found</p>
          ) : filtered.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                {u.full_name ? u.full_name[0].toUpperCase() : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{u.full_name ?? '—'}</p>
                <p className="text-xs text-gray-400">{u.phone}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_COLOR[u.role] ?? 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
              <button onClick={() => toggleActive(u.id, u.is_active)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${u.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-700'}`}>
                {u.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
