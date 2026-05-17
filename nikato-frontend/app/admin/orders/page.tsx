'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/admin/DataTable';
import type { Column } from '@/components/admin/DataTable';
import { Badge, Skeleton } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const STATUS_OPTIONS = ['all','pending','confirmed','preparing','ready','picked_up','delivered','cancelled','rejected'];
const STATUS_BADGE: Record<OrderStatus, 'warning'|'info'|'success'|'danger'|'default'> = {
  pending:'warning', confirmed:'info', preparing:'info', ready:'info',
  picked_up:'warning', delivered:'success', cancelled:'danger', rejected:'danger',
};

type OrderRow = {
  id: string; order_number: string; status: OrderStatus;
  total_amount: number; created_at: string;
  shop: { name: string } | null;
  customer: { full_name: string | null; phone: string | null } | null;
};

const COLUMNS: Column<OrderRow>[] = [
  { key: 'order_number', label: 'Order #', render: (r) => <span className="font-bold">#{r.order_number}</span> },
  { key: 'shop', label: 'Shop', render: (r) => r.shop?.name ?? '—' },
  { key: 'customer', label: 'Customer', render: (r) => r.customer?.full_name ?? '—' },
  { key: 'status', label: 'Status', render: (r) => <Badge variant={STATUS_BADGE[r.status]}>{r.status.replace('_',' ')}</Badge> },
  { key: 'total_amount', label: 'Amount', render: (r) => formatPrice(r.total_amount) },
  { key: 'created_at', label: 'Time', render: (r) => formatRelativeTime(r.created_at) },
];

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orders = [], isLoading } = useQuery<OrderRow[]>({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      const url = `/api/admin/orders${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      return d.orders as OrderRow[];
    },
    staleTime: 15000,
    refetchInterval: 30000,
  });

  return (
    <div className="p-4 lg:p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-4">All Orders</h1>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {STATUS_OPTIONS.map(opt => (
          <button key={opt} onClick={() => setStatusFilter(opt)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-colors ${statusFilter === opt ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-600'}`}>
            {opt.replace('_',' ')}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <DataTable columns={COLUMNS} data={orders} emptyText="No orders found" />
      )}
    </div>
  );
}
