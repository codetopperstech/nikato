'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge, Skeleton } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { Profile } from '@/types';

type DPRow = Profile & {
  location: { is_online: boolean; updated_at: string } | null;
  earnings: number;
};

export default function AdminDeliveryPartnersPage() {
  const { data: partners = [], isLoading } = useQuery<DPRow[]>({
    queryKey: ['admin-delivery-partners'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'delivery')
        .order('full_name');

      const ids = (profiles ?? []).map((p) => p.id);
      if (ids.length === 0) return [];

      const [{ data: locations }, { data: orders }] = await Promise.all([
        supabase.from('delivery_locations').select('delivery_partner_id, is_online, updated_at').in('delivery_partner_id', ids),
        supabase.from('orders').select('delivery_partner_id, delivery_earning').in('delivery_partner_id', ids).eq('status', 'delivered'),
      ]);

      const locMap: Record<string, { is_online: boolean; updated_at: string }> = {};
      (locations ?? []).forEach((l) => { locMap[l.delivery_partner_id] = l; });

      const earningsMap: Record<string, number> = {};
      (orders ?? []).forEach((o) => {
        if (o.delivery_partner_id) {
          earningsMap[o.delivery_partner_id] = (earningsMap[o.delivery_partner_id] ?? 0) + (o.delivery_earning ?? 0);
        }
      });

      return (profiles ?? []).map((p) => ({
        ...(p as Profile),
        location: locMap[p.id] ?? null,
        earnings: earningsMap[p.id] ?? 0,
      }));
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const COLUMNS: Column<DPRow>[] = [
    { key: 'full_name', label: 'Name', render: (r) => <span className="font-semibold">{r.full_name}</span> },
    { key: 'phone', label: 'Phone' },
    {
      key: 'is_online',
      label: 'Status',
      render: (r) => (
        <Badge variant={r.location?.is_online ? 'success' : 'default'}>
          {r.location?.is_online ? 'Online' : 'Offline'}
        </Badge>
      ),
    },
    {
      key: 'earnings',
      label: 'Total Earned',
      render: (r) => <span className="font-bold text-green-600">{formatPrice(r.earnings)}</span>,
    },
    {
      key: 'updated_at',
      label: 'Last Active',
      render: (r) => r.location ? formatRelativeTime(r.location.updated_at) : '—',
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Delivery Partners</h1>
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <DataTable columns={COLUMNS} data={partners} emptyText="No delivery partners found" />
      )}
    </div>
  );
}
