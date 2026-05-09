'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { OrderCard } from '@/components/order/OrderStatusStepper';
import { Skeleton, EmptyState, Button } from '@/components/ui';
import type { Order } from '@/types';

async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export default function OrdersPage() {
  const { user } = useAuthStore();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => fetchOrders(user!.id),
    enabled: !!user,
    staleTime: 0,
    refetchInterval: 30000,
  });

  const active = orders.filter((o) => !['delivered', 'cancelled', 'rejected'].includes(o.status));
  const past = orders.filter((o) => ['delivered', 'cancelled', 'rejected'].includes(o.status));

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-lg font-black text-gray-900">My Orders</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 space-y-2 border border-gray-100">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package size={48} className="text-gray-200" />}
            title="No orders yet"
            description="Your order history will appear here"
            action={<Link href="/shops"><Button variant="primary">Browse shops</Button></Link>}
          />
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
                  Active Orders ({active.length})
                </h2>
                <div className="space-y-3">
                  {active.map((o) => <OrderCard key={o.id} order={o} />)}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-4">
                  Past Orders ({past.length})
                </h2>
                <div className="space-y-3">
                  {past.map((o) => <OrderCard key={o.id} order={o} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
