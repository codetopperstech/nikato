// ============================================================
// NIKATO — hooks/useDeliveryLocation.ts
// Realtime delivery partner lat/lng for map tracking
// Blueprint Section 12: Realtime Order Flow
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Coords } from '@/types';

export function useDeliveryLocation(partnerId: string | null | undefined) {
  const [location, setLocation] = useState<Coords | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!partnerId) return;

    // Initial fetch
    supabase
      .from('delivery_locations')
      .select('lat, lng, is_online')
      .eq('delivery_partner_id', partnerId)
      .single()
      .then(({ data }) => {
        if (data) {
          setLocation({ lat: data.lat, lng: data.lng });
          setIsOnline(data.is_online);
        }
      });

    // Realtime broadcast subscription
    const channel = supabase
      .channel(`delivery:${partnerId}`)
      .on('broadcast', { event: 'location' }, (payload) => {
        const { lat, lng } = payload.payload as { lat: number; lng: number };
        setLocation({ lat, lng });
        setIsOnline(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId]);

  return { location, isOnline };
}
