'use client';

import { useQuery } from '@tanstack/react-query';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge, Skeleton } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { Profile } from '@/types';

type DPRow = Profile & {
  location: { is_online: boolean; updated_at: string } | null;
  earnings: number;
};

export default function AdminDeliveryPartnersPage() {
  const { data: partners = [], isLoading, error } = useQuery<DPRow[]>({
    queryKey: ['admin-delivery-partners'],
    queryFn: async () => {
      const res = await fetch('/api/admin/delivery-partners');
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to fetch delivery partners');
      }
      const json = await res.json();
      return json.partners ?? [];
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm">
          ⚠️ {(error as Error).message}
        </div>
      )}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <DataTable columns={COLUMNS} data={partners} emptyText="No delivery partners found" />
      )}
    </div>
  );
}
