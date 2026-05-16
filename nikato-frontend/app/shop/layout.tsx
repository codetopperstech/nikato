'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShopSidebar } from '@/components/shop/ShopSidebar';
import { Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/ui';
import type { Order, Shop } from '@/types';

function playNewOrderSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  } catch { /* AudioContext not available */ }
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth('shop_owner');
  const { setShop, setIsOpen, setPendingOrders, addPendingOrder, shopData } = useShopStore();
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const shopChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isOnlineRef = useRef(true);

  const { isLoading: shopLoading } = useQuery({
    queryKey: ['my-shop', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('shops').select('*').eq('owner_id', user!.id).single();
      if (error) throw error;
      setShop(data as Shop);
      return data as Shop;
    },
    enabled: !!user && role === 'shop_owner',
    staleTime: 60000,
  });

  const fetchPending = useCallback(async (shopId: string) => {
    const { data } = await supabase.from('orders').select('*')
      .eq('shop_id', shopId).eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPendingOrders((data ?? []) as Order[]);
  }, [setPendingOrders]);

  useQuery({
    queryKey: ['pending-orders', shopData?.id],
    queryFn: () => fetchPending(shopData!.id),
    enabled: !!shopData?.id,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  // ✅ Hardened realtime: orders channel
  useEffect(() => {
    if (!shopData?.id) return;
    const shopId = shopData.id;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`shop-orders-${shopId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` }, (payload) => {
        const order = payload.new as Order;
        addPendingOrder(order);
        playNewOrderSound();
        toast.success('New order!', `#${order.order_number}`);
        qc.invalidateQueries({ queryKey: ['shop-orders', shopId] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` }, () => {
        qc.invalidateQueries({ queryKey: ['shop-orders', shopId] });
        fetchPending(shopId);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setTimeout(() => { channel.subscribe(); }, 3000);
        }
      });

    channelRef.current = channel;
    return () => {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    };
  }, [shopData?.id, addPendingOrder, fetchPending, qc]);

  // ✅ Shop is_open realtime sync (multi-device consistency)
  useEffect(() => {
    if (!shopData?.id) return;
    const shopId = shopData.id;

    if (shopChannelRef.current) {
      supabase.removeChannel(shopChannelRef.current);
      shopChannelRef.current = null;
    }

    const shopChannel = supabase
      .channel(`shop-state-${shopId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shops', filter: `id=eq.${shopId}` }, (payload) => {
        const updated = payload.new as Shop;
        setIsOpen(updated.is_open);
        qc.invalidateQueries({ queryKey: ['my-shop', user?.id] });
      })
      .subscribe();

    shopChannelRef.current = shopChannel;
    return () => {
      if (shopChannelRef.current) { supabase.removeChannel(shopChannelRef.current); shopChannelRef.current = null; }
    };
  }, [shopData?.id, user?.id, setIsOpen, qc]);

  // ✅ Page Visibility API — recover stale state when tab becomes active
  useEffect(() => {
    if (!shopData?.id) return;
    const shopId = shopData.id;

    const onVisibilityChange = () => {
      if (!document.hidden) {
        qc.invalidateQueries({ queryKey: ['pending-orders', shopId] });
        qc.invalidateQueries({ queryKey: ['shop-orders', shopId] });
        qc.invalidateQueries({ queryKey: ['my-shop', user?.id] });
      }
    };

    // ✅ Offline/online handling
    const onOnline = () => {
      if (!isOnlineRef.current) {
        isOnlineRef.current = true;
        toast.success('Back online', 'Syncing orders…');
        qc.invalidateQueries({ queryKey: ['pending-orders', shopId] });
        qc.invalidateQueries({ queryKey: ['shop-orders', shopId] });
      }
    };
    const onOffline = () => {
      isOnlineRef.current = false;
      toast.error('You are offline', 'Orders will sync when reconnected');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [shopData?.id, user?.id, qc]);

  if (loading || shopLoading) {
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
        <div className="pt-14 lg:pt-0">{children}</div>
      </main>
    </div>
  );
}
