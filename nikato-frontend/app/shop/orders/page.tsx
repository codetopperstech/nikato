'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { Badge, Skeleton, EmptyState } from '@/components/ui';
import { formatPrice, formatRelativeTime, getOrderStatusLabel } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const TABS: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Pending', statuses: ['pending'] },
  { label: 'Active', statuses: ['confirmed', 'preparing', 'ready', 'picked_up'] },
  { label: 'Done', statuses: ['delivered', 'cancelled', 'rejected'] },
];

const STATUS_BADGE: Record<OrderStatus, { variant: 'warning' | 'info' | 'success' | 'danger' | 'default'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'info', label: 'Confirmed' },
  preparing: { variant: 'info', label: 'Preparing' },
  ready: { variant: 'info', label: 'Ready' },
  picked_up: { variant: 'warning', label: 'Picked Up' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  rejected: { variant: 'danger', label: 'Rejected' },
};

export default function ShopOrdersPage() {
  const { shopData } = useShopStore();
  const [tab, setTab] = useState(0);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['shop-orders', shopData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopData!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    enabled: !!shopData?.id,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const filtered = orders.filter((o) => TABS[tab].statuses.includes(o.status));

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Orders</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        {TABS.map((t, i) => {
          const count = orders.filter((o) => t.statuses.includes(o.status)).length;
          return (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-semibold transition-colors ${
                tab === i ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label} {count > 0 && <span className="ml-1 text-xs">({count})</span>}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No orders" description={`No ${TABS[tab].label.toLowerCase()} orders`} />
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const badge = STATUS_BADGE[order.status];
            return (
              <Link
                key={order.id}
                href={`/shop/orders/${order.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#FF6B35]/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-900 text-sm">#{order.order_number}</span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatPrice(order.total_amount)} · {formatRelativeTime(order.created_at)}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
