// ============================================================
// NIKATO — components/map/MapViewInner.tsx
// Actual Leaflet implementation — imported dynamically only
// Blueprint Section 13
// ============================================================

'use client';

import { useEffect, useRef } from 'react';
import type { MapViewProps } from './MapView';
import { cn } from '@/lib/utils';

// Leaflet CSS must be imported here
import 'leaflet/dist/leaflet.css';

let L: typeof import('leaflet') | null = null;

async function getLeaflet() {
  if (!L) {
    L = await import('leaflet');
    // Fix default icon paths broken by webpack
    delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }
  return L;
}

export default function MapViewInner({
  center,
  zoom = 14,
  className,
  children,
  onClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;

    getLeaflet().then((leaflet) => {
      if (!mounted || !containerRef.current) return;

      const map = leaflet.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      leaflet
        .tileLayer(
          process.env.NEXT_PUBLIC_OSM_TILE_URL ??
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }
        )
        .addTo(map);

      if (onClick) {
        map.on('click', (e) => {
          onClick(e.latlng.lat, e.latlng.lng);
        });
      }

      mapRef.current = map;
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pan map when center changes
  useEffect(() => {
    mapRef.current?.panTo([center.lat, center.lng]);
  }, [center.lat, center.lng]);

  return (
    <div
      ref={containerRef}
      className={cn('h-full w-full', className)}
      style={{ minHeight: 300 }}
    >
      {/* Leaflet renders into this div; children are portal'd by ShopMarker etc. */}
      {children}
    </div>
  );
}
