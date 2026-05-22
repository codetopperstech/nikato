'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { Skeleton } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { OrderStatus } from '@/types';

type OrderRow = { id: string; order_number: string; status: OrderStatus; total_amount: number; payment_method: string; created_at: string; customer: { full_name: string | null; phone: string | null } | null; };

const TABS: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Pending', statuses: ['pending'] },
  { label: 'Active',  statuses: ['confirmed','preparing','ready','picked_up'] },
  { label: 'Done',    statuses: ['delivered','cancelled','rejected'] },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fff7ed', color: '#c2570a' },
  confirmed: { bg: '#e8f6ff', color: '#0369a1' },
  preparing: { bg: '#f5f3ff', color: '#7c3aed' },
  ready:     { bg: '#edfbdc', color: '#3a7a1f' },
  picked_up: { bg: '#edfbdc', color: '#3a7a1f' },
  delivered: { bg: '#edfbdc', color: '#166534' },
  cancelled: { bg: '#fef2f2', color: '#dc2626' },
  rejected:  { bg: '#fef2f2', color: '#dc2626' },
};

export default function ShopOrdersPage() {
  const { shopData } = useShopStore();
  const [tab, setTab] = useState(0);

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery<OrderRow[]>({
    queryKey: ['shop-orders', shopData?.id],
    queryFn: async () => { const res = await fetch('/api/shop/orders'); if (!res.ok) throw new Error('Failed'); return (await res.json()).orders as OrderRow[]; },
    enabled: !!shopData?.id, staleTime: 15000, refetchInterval: 20000,
  });

  const filtered = orders.filter(o => TABS[tab].statuses.includes(o.status));

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-gray-900">Orders</h1>
        <button onClick={() => refetch()} disabled={isFetching} className="p-2 rounded-xl hover:bg-surface-2 text-gray-400 disabled:opacity-40 transition-colors">
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="flex gap-1 bg-surface-2 p-1 rounded-2xl mb-4">
        {TABS.map((t, i) => {
          const count = orders.filter(o => t.statuses.includes(o.status)).length;
          return (
            <button key={i} onClick={() => setTab(i)} className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${i === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              {t.label}{count > 0 && <span className="ml-1.5 text-xs">({count})</span>}
            </button>
          );
        })}
      </div>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400 text-sm">No {TABS[tab].label.toLowerCase()} orders</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => {
            const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
            const ageMin = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
            return (
              <Link key={order.id} href={`/shop/orders/${order.id}`} className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-card-hover transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-black text-sm text-gray-900">#{order.order_number}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: s.bg, color: s.color }}>{order.status.replace('_', ' ')}</span>
                    {order.status === 'pending' && ageMin >= 10 && <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-semibold animate-pulse">⚠ {ageMin}m</span>}
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{order.customer?.full_name ?? 'Customer'} · {order.payment_method}</p>
                  <p className="text-xs text-gray-400">{formatPrice(order.total_amount)} · {formatRelativeTime(order.created_at)}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
