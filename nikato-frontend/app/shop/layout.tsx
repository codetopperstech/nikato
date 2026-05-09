'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ShopSidebar } from '@/components/shop/ShopSidebar';
import { Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import type { Order, Shop } from '@/types';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, isLoading: authLoading } = useAuthStore();
  const { setShop, setPendingOrders, addPendingOrder, shopData } = useShopStore();

  // Fetch shop data
  const { isLoading: shopLoading } = useQuery({
    queryKey: ['my-shop', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user!.id)
        .single();
      if (error) throw error;
      setShop(data as Shop);
      return data as Shop;
    },
    enabled: !!user && role === 'shop_owner',
  });

  // Fetch pending orders once shop is loaded
  useQuery({
    queryKey: ['pending-orders', shopData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopData!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPendingOrders((data ?? []) as Order[]);
      return data;
    },
    enabled: !!shopData?.id,
  });

  // Realtime: new incoming orders
  useEffect(() => {
    if (!shopData?.id) return;

    const channel = supabase
      .channel(`shop-new-orders-${shopData.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopData.id}` },
        (payload) => {
          addPendingOrder(payload.new as Order);
          toast.success('New order received!', `Order #${(payload.new as Order).order_number}`);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shopData?.id, addPendingOrder]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || role !== 'shop_owner')) {
      router.replace('/unauthorized');
    }
  }, [authLoading, user, role, router]);

  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <Spinner size="lg" className="text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      <ShopSidebar />
      <main className="flex-1 min-w-0 pt-0 lg:pt-0">
        {/* Mobile top padding to clear fixed header */}
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
