'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { Skeleton } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { Order } from '@/types';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fff7ed', color: '#c2570a', label: 'Pending' },
  confirmed: { bg: '#e8f6ff', color: '#0369a1', label: 'Confirmed' },
  preparing: { bg: '#f5f3ff', color: '#7c3aed', label: 'Preparing' },
  ready:     { bg: '#edfbdc', color: '#3a7a1f', label: 'Ready' },
  picked_up: { bg: '#edfbdc', color: '#3a7a1f', label: 'On the way' },
  delivered: { bg: '#edfbdc', color: '#166534', label: 'Delivered' },
  cancelled: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
  rejected:  { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
};

export default function OrdersPage() {
  const { user } = useAuthStore();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').eq('customer_id', user!.id).order('created_at', { ascending: false });
      return (data ?? []) as Order[];
    },
    enabled: !!user,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen pb-10" style={{ background: '#F9FBF8' }}>
      <div className="sticky top-14 z-10 bg-white border-b border-gray-100 px-4 py-3.5">
        <h1 className="text-base font-black text-gray-900">My Orders</h1>
      </div>
      <div className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#edfbdc' }}>
              <Package size={28} style={{ color: '#5cb83a' }} />
            </div>
            <p className="font-bold text-gray-700">No orders yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Your orders will appear here</p>
            <Link href="/shops" className="inline-flex items-center gap-1 text-sm font-bold px-5 py-2.5 rounded-xl text-white" style={{ background: '#7ED957' }}>Browse shops</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(order => {
              const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
              const active = ['pending','confirmed','preparing','ready','picked_up'].includes(order.status);
              return (
                <Link key={order.id} href={`/orders/${order.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-card hover:shadow-card-hover transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                    <Package size={18} style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm text-gray-900">#{order.order_number}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
                        {s.label}{active && <span className="ml-1 inline-block w-1 h-1 rounded-full animate-pulse align-middle" style={{ background: s.color }} />}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{formatPrice(order.total_amount)} · {formatRelativeTime(order.created_at)}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
