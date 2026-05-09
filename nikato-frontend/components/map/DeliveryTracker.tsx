// ============================================================
// NIKATO — components/map/DeliveryTracker.tsx
// Live delivery partner pin on Leaflet map
// Blueprint Section 09 & 12
// ============================================================

'use client';

import { useEffect, useRef } from 'react';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';

interface DeliveryTrackerProps {
  partnerId: string | null | undefined;
  mapInstance: unknown; // Leaflet Map instance
}

export function DeliveryTracker({ partnerId, mapInstance }: DeliveryTrackerProps) {
  const { location, isOnline } = useDeliveryLocation(partnerId);
  const markerRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapInstance || !location) return;

    import('leaflet').then((L) => {
      const map = mapInstance as import('leaflet').Map;

      const icon = L.divIcon({
        html: `
          <div class="relative">
            <div class="w-10 h-10 rounded-full bg-[#FF6B35] border-3 border-white shadow-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            ${isOnline ? '<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>' : ''}
          </div>
        `,
        className: 'nikato-delivery-marker',
        iconAnchor: [20, 40],
      });

      if (markerRef.current) {
        (markerRef.current as import('leaflet').Marker).setLatLng([
          location.lat,
          location.lng,
        ]);
      } else {
        const marker = L.marker([location.lat, location.lng], { icon }).addTo(map);
        markerRef.current = marker;
      }
    });
  }, [location, mapInstance, isOnline]);

  useEffect(() => {
    return () => {
      if (markerRef.current && mapInstance) {
        import('leaflet').then(() => {
          (markerRef.current as import('leaflet').Marker).remove();
          markerRef.current = null;
        });
      }
    };
  }, [mapInstance]);

  return null;
}
