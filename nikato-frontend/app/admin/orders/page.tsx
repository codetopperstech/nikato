'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { DataTable } from '@/components/admin/DataTable';
import type { Column } from '@/components/admin/DataTable';
import { Badge, Skeleton } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE: Record<OrderStatus, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
  pending: 'warning', confirmed: 'info', preparing: 'info', ready: 'info',
  picked_up: 'warning', delivered: 'success', cancelled: 'danger', rejected: 'danger',
};

type OrderRow = Order & { shop: { name: string } };

const COLUMNS: Column<OrderRow>[] = [
  { key: 'order_number', label: 'Order #', render: (r) => <span className="font-bold">#{r.order_number}</span> },
  { key: 'shop', label: 'Shop', render: (r) => r.shop?.name ?? '—' },
  {
    key: 'status',
    label: 'Status',
    render: (r) => <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>,
  },
  { key: 'total_amount', label: 'Amount', render: (r) => formatPrice(r.total_amount) },
  { key: 'created_at', label: 'Time', render: (r) => formatRelativeTime(r.created_at) },
];

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orders = [], isLoading } = useQuery<OrderRow[]>({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('*, shop:shops(name)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data } = await q;
      return (data ?? []) as OrderRow[];
    },
    staleTime: 15000,
    refetchInterval: 30000,
  });

  return (
    <div className="p-4 lg:p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-4">All Orders</h1>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${statusFilter === opt.value ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <DataTable columns={COLUMNS} data={orders} emptyText="No orders found" />
      )}
    </div>
  );
}
