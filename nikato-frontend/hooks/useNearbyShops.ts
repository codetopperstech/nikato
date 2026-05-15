'use client';
import { useQuery } from '@tanstack/react-query';
import type { Shop } from '@/types';

async function fetchNearbyShops(lat: number, lng: number, radius_km = 5): Promise<Shop[]> {
  const res = await fetch('/api/shops/nearby', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, radius_km }),
  });
  if (!res.ok) throw new Error('Failed to fetch shops');
  const data = await res.json();
  return data.shops ?? [];
}

export function useNearbyShops(
  lat: number | null | undefined,
  lng: number | null | undefined,
  radius_km = 5
) {
  return useQuery({
    queryKey: ['nearby-shops', lat, lng, radius_km],
    queryFn: () => fetchNearbyShops(lat!, lng!, radius_km),
    enabled: lat != null && lng != null,
    staleTime: 60 * 1000,
    retry: 2,
  });
}
