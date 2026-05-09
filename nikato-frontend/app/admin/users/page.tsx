'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/store/ui';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge, Button, Skeleton } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import type { Profile, UserRole } from '@/types';

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'customer', label: 'Customers' },
  { value: 'shop_owner', label: 'Shop Owners' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'admin', label: 'Admins' },
];

const ROLE_BADGE: Record<UserRole, 'default' | 'info' | 'warning' | 'danger'> = {
  customer: 'default', shop_owner: 'info', delivery: 'warning', admin: 'danger',
};

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState('all');
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['admin-users', roleFilter],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (roleFilter !== 'all') q = q.eq('role', roleFilter as UserRole);
      const { data } = await q;
      return (data ?? []) as Profile[];
    },
    staleTime: 60000,
  });

  async function toggleActive(user: Profile) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id);
    if (error) toast.error('Failed to update user');
    else {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(user.is_active ? 'User deactivated' : 'User activated');
    }
  }

  const COLUMNS: Column<Profile>[] = [
    { key: 'full_name', label: 'Name', render: (r) => <span className="font-semibold">{r.full_name}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: (r) => <Badge variant={ROLE_BADGE[r.role]}>{r.role}</Badge> },
    {
      key: 'is_active',
      label: 'Status',
      render: (r) => <Badge variant={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Active' : 'Banned'}</Badge>,
    },
    { key: 'created_at', label: 'Joined', render: (r) => formatRelativeTime(r.created_at) },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Users</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoleFilter(opt.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${roleFilter === opt.value ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <DataTable
          columns={COLUMNS}
          data={users}
          actions={(user) => (
            <Button
              size="sm"
              variant={user.is_active ? 'danger' : 'outline'}
              onClick={() => toggleActive(user)}
            >
              {user.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          )}
          emptyText="No users found"
        />
      )}
    </div>
  );
}
