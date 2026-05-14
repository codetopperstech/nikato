'use client';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';

export function useLocationBroadcast(enabled: boolean) {
  const user = useAuthStore((s) => s.user);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!enabled || !user) return;
    const uid = user.id;

    channelRef.current = supabase.channel(`delivery-location-${uid}`);

    const broadcast = async () => {
      if (!navigator?.geolocation) return;
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        await supabase.from('delivery_locations').upsert(
          { delivery_partner_id: uid, lat, lng, is_online: true, updated_at: new Date().toISOString() },
          { onConflict: 'delivery_partner_id' }
        );
        channelRef.current?.send({ type: 'broadcast', event: 'location', payload: { lat, lng } });
      }, () => {}); // silent fail on permission denied
    };

    channelRef.current.subscribe(() => { broadcast(); });
    const interval = setInterval(broadcast, 5000);

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        supabase.from('delivery_locations')
          .update({ is_online: false, updated_at: new Date().toISOString() })
          .eq('delivery_partner_id', uid);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, user]);
}
