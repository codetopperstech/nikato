'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ShopSidebar } from '@/components/shop/ShopSidebar';
import { Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import type { Order, Shop } from '@/types';
import type { User } from '@supabase/supabase-js';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setShop, setPendingOrders, addPendingOrder, shopData } = useShopStore();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ✅ Directly fetch user + role from Supabase (don't rely on store)
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthLoading(false); router.replace('/login'); return; }
      setUser(user);
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const r = profile?.role ?? null;
      setRole(r);
      setAuthLoading(false);
      if (r !== 'shop_owner') router.replace('/unauthorized');
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { router.replace('/login'); }
    });
    return () => subscription.unsubscribe();
  }, [router]);

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

  // Fetch pending orders
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

  // Realtime: new orders
  useEffect(() => {
    if (!shopData?.id) return;
    const channel = supabase
      .channel(`shop-new-orders-${shopData.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopData.id}` },
        (payload) => {
          addPendingOrder(payload.new as Order);
          toast.success('New order received!', `Order #${(payload.new as Order).order_number}`);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shopData?.id, addPendingOrder]);

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
      <main className="flex-1 min-w-0">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
