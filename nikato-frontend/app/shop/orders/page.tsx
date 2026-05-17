'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { Badge, Skeleton, EmptyState } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { OrderStatus } from '@/types';

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: string;
  created_at: string;
  customer: { full_name: string | null; phone: string | null } | null;
};

const TABS: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Pending', statuses: ['pending'] },
  { label: 'Active', statuses: ['confirmed', 'preparing', 'ready', 'picked_up'] },
  { label: 'Done', statuses: ['delivered', 'cancelled', 'rejected'] },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700', ready: 'bg-indigo-100 text-indigo-700',
  picked_up: 'bg-cyan-100 text-cyan-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600', rejected: 'bg-red-100 text-red-600',
};

export default function ShopOrdersPage() {
  const { shopData } = useShopStore();
  const [tab, setTab] = useState(0);

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery<OrderRow[]>({
    queryKey: ['shop-orders', shopData?.id],
    queryFn: async () => {
      const res = await fetch('/api/shop/orders');
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      return d.orders as OrderRow[];
    },
    enabled: !!shopData?.id,
    staleTime: 15000,
    refetchInterval: 20000,
  });

  const filtered = orders.filter((o) => TABS[tab].statuses.includes(o.status));

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-gray-900">Orders</h1>
        <button onClick={() => refetch()} disabled={isFetching} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 disabled:opacity-40">
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        {TABS.map((t, i) => {
          const count = orders.filter((o) => t.statuses.includes(o.status)).length;
          return (
            <button key={i} onClick={() => setTab(i)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-semibold transition-colors ${tab === i ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label} {count > 0 && <span className="ml-1 text-xs">({count})</span>}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No orders" description={`No ${TABS[tab].label.toLowerCase()} orders`} />
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const ageMin = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
            return (
              <Link key={order.id} href={`/shop/orders/${order.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#FF6B35]/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">#{order.order_number}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLOR[order.status]}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    {order.status === 'pending' && ageMin >= 10 &&
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">⚠️ {ageMin}m</span>}
                  </div>
                  {/* ✅ Customer name */}
                  <p className="text-xs font-medium text-gray-700 mb-0.5">
                    {order.customer?.full_name ?? 'Customer'} · {order.payment_method}
                  </p>
                  <p className="text-xs text-gray-400">{formatPrice(order.total_amount)} · {formatRelativeTime(order.created_at)}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
