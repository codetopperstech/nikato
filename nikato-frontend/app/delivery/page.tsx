'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useDeliveryStore } from '@/store/delivery';
import { useAuth } from '@/hooks/useAuth';
import { OnlineToggle } from '@/components/delivery/OnlineToggle';
import { ActiveDelivery } from '@/components/delivery/ActiveDelivery';
import { EarningsSummary } from '@/components/delivery/EarningsSummary';
import { Badge, Skeleton } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { Order } from '@/types';

export default function DeliveryHomePage() {
  const { profile } = useAuth();
  const { isOnline, currentDelivery } = useDeliveryStore();

  const { data: available = [], isLoading } = useQuery<Order[]>({
    queryKey: ['available-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, shop:shops(name, address_line)')
        .eq('status', 'ready')
        .is('delivery_partner_id', null)
        .order('created_at', { ascending: false })
        .limit(5);
      return (data ?? []) as Order[];
    },
    enabled: isOnline && !currentDelivery,
    refetchInterval: 15000,
  });

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <div>
        <p className="text-xs text-gray-500">Welcome back</p>
        <h1 className="text-2xl font-black text-gray-900">{profile?.full_name ?? 'Delivery Partner'}</h1>
      </div>
      <OnlineToggle />
      {currentDelivery && <ActiveDelivery />}
      <EarningsSummary />
      {isOnline && !currentDelivery && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {isLoading ? 'Loading...' : `Available (${available.length})`}
            </h2>
            <Link href="/delivery/orders" className="text-xs text-[#FF6B35] font-semibold flex items-center gap-0.5">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : available.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4 bg-white rounded-2xl border border-gray-100">No orders available nearby.</p>
          ) : (
            <div className="space-y-2">
              {available.map((o) => {
                const shop = (o as { shop?: { name: string } }).shop;
                return (
                  <Link key={o.id} href={`/delivery/orders/${o.id}`}
                    className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#FF6B35]/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">#{o.order_number}</p>
                      <p className="text-xs text-gray-500 truncate">{shop?.name} · {formatRelativeTime(o.created_at)}</p>
                    </div>
                    <Badge variant="success">{formatPrice(o.delivery_earning)}</Badge>
                    <ChevronRight size={16} className="text-gray-400" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
