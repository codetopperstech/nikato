'use client';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';

export function useLocationBroadcast(enabled: boolean) {
  const user = useAuthStore((s) => s.user);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !user) return;
    const uid = user.id;

    // ✅ Cleanup any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    channelRef.current = supabase.channel(`delivery-location-${uid}`);
    channelRef.current.subscribe();

    async function pushLocation(lat: number, lng: number) {
      await supabase.from('delivery_locations').upsert(
        { delivery_partner_id: uid, lat, lng, is_online: true, updated_at: new Date().toISOString() },
        { onConflict: 'delivery_partner_id' }
      );
      channelRef.current?.send({ type: 'broadcast', event: 'location', payload: { lat, lng } });
    }

    if (!navigator?.geolocation) return;

    // ✅ watchPosition — continuous updates (better than setInterval + getCurrentPosition)
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => { pushLocation(coords.latitude, coords.longitude); },
      () => {}, // silent fail on permission denied
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      // ✅ Stop watching GPS
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // ✅ Mark offline
      supabase.from('delivery_locations')
        .update({ is_online: false, updated_at: new Date().toISOString() })
        .eq('delivery_partner_id', uid);
      // ✅ Remove channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, user]);
}
