// ============================================================
// NIKATO — components/map/ShopMarker.tsx
// Custom shop pin for Leaflet map
// ============================================================

'use client';

import { useEffect, useRef } from 'react';
import type { Shop } from '@/types';

interface ShopMarkerProps {
  shop: Shop;
  mapInstance: unknown; // Leaflet Map instance
  onClick?: (shop: Shop) => void;
}

export function ShopMarker({ shop, mapInstance, onClick }: ShopMarkerProps) {
  const markerRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapInstance) return;
    let mounted = true;

    import('leaflet').then((L) => {
      if (!mounted) return;
      const map = mapInstance as import('leaflet').Map;

      const icon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="bg-white border-2 ${shop.is_open ? 'border-green-500' : 'border-gray-400'} rounded-full p-1.5 shadow-md">
              <img src="${shop.logo_url ?? '/icons/shop-default.png'}" class="w-8 h-8 rounded-full object-cover" />
            </div>
            <div class="text-xs font-semibold bg-white px-1.5 py-0.5 rounded shadow mt-0.5 max-w-[80px] truncate">${shop.name}</div>
          </div>
        `,
        className: 'nikato-shop-marker',
        iconAnchor: [20, 48],
      });

      const marker = L.marker([shop.lat, shop.lng], { icon }).addTo(map);
      if (onClick) {
        marker.on('click', () => onClick(shop));
      }
      markerRef.current = marker;
    });

    return () => {
      mounted = false;
      if (markerRef.current) {
        import('leaflet').then((L) => {
          (markerRef.current as import('leaflet').Marker).removeFrom(
            mapInstance as import('leaflet').Map
          );
        });
        markerRef.current = null;
      }
    };
  }, [shop, mapInstance, onClick]);

  return null;
}
