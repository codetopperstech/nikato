// ============================================================
// NIKATO — components/map/MapView.tsx
// Leaflet map wrapper — always dynamic import (no SSR)
// Blueprint Section 07 & 13
// ============================================================

'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui';

// All Leaflet components must be dynamically imported
const MapViewInner = dynamic(() => import('./MapViewInner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-100 rounded-2xl h-full w-full">
      <Spinner size="md" className="text-[#FF6B35]" />
    </div>
  ),
});

export interface MapViewProps {
  center: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  onClick?: (lat: number, lng: number) => void;
}

export default function MapView(props: MapViewProps) {
  return <MapViewInner {...props} />;
}
