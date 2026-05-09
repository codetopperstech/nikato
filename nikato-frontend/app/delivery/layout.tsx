'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DeliveryNav } from '@/components/delivery/DeliveryNav';
import { Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { useDeliveryStore } from '@/store/delivery';
import { useLocationBroadcast } from '@/hooks/useLocationBroadcast';
import type { Order } from '@/types';

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, isLoading: authLoading } = useAuthStore();
  const { isOnline, setEarnings, setCurrentDelivery } = useDeliveryStore();

  // Broadcast location when online
  useLocationBroadcast(isOnline);

  // Fetch earnings
  useQuery({
    queryKey: ['delivery-earnings', user?.id],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data } = await supabase
        .from('orders')
        .select('delivery_earning, created_at')
        .eq('delivery_partner_id', user!.id)
        .eq('status', 'delivered');

      const rows = (data ?? []) as { delivery_earning: number; created_at: string }[];
      const sum = (from: string) =>
        rows.filter((r) => r.created_at >= from).reduce((acc, r) => acc + (r.delivery_earning ?? 0), 0);

      setEarnings({ today: sum(todayStart), week: sum(weekStart), month: sum(monthStart) });
      return data;
    },
    enabled: !!user && role === 'delivery',
    staleTime: 60000,
  });

  // Fetch active delivery
  useQuery({
    queryKey: ['active-delivery', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, shop:shops(*), address:addresses(*), order_items(*, product:products(name, image_url))')
        .eq('delivery_partner_id', user!.id)
        .eq('status', 'picked_up')
        .maybeSingle();
      setCurrentDelivery((data as Order | null) ?? null);
      return data;
    },
    enabled: !!user && role === 'delivery',
  });

  // Realtime: active delivery status
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`delivery-order-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `delivery_partner_id=eq.${user.id}` },
        (payload) => setCurrentDelivery(payload.new as Order)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, setCurrentDelivery]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || role !== 'delivery')) {
      router.replace('/unauthorized');
    }
  }, [authLoading, user, role, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <Spinner size="lg" className="text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-20">
      {children}
      <DeliveryNav />
    </div>
  );
}
