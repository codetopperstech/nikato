// ============================================================
// NIKATO — hooks/useNearbyShops.ts
// Fetches nearby shops via nearby-shops Edge Function
// Blueprint Section 07 & 06
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Shop } from '@/types';

const DEFAULT_RADIUS_KM = 5;

async function fetchNearbyShops(lat: number, lng: number, radius_km = DEFAULT_RADIUS_KM): Promise<Shop[]> {
  const { data, error } = await supabase.functions.invoke<{ shops: Shop[] }>(
    'nearby-shops',
    {
      body: { lat, lng, radius_km },
    }
  );

  if (error) throw error;
  return data?.shops ?? [];
}

export function useNearbyShops(
  lat: number | null | undefined,
  lng: number | null | undefined,
  radius_km = DEFAULT_RADIUS_KM
) {
  return useQuery({
    queryKey: ['nearby-shops', lat, lng, radius_km],
    queryFn: () => fetchNearbyShops(lat!, lng!, radius_km),
    enabled: lat != null && lng != null,
    staleTime: 60 * 1000, // 60s stale-while-revalidate
    retry: 2,
  });
}
