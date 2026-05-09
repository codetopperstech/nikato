// ============================================================
// NIKATO — hooks/useGeolocation.ts
// Browser geolocation with manual fallback
// Blueprint Section 13: Location & Delivery Radius
// ============================================================

'use client';

import { useCallback } from 'react';
import { useLocationStore } from '@/store/location';

export function useGeolocation() {
  const {
    coords,
    address,
    isManual,
    permissionState,
    setCoords,
    setAddress,
    setPermission,
    setManualLocation,
    clearLocation,
  } = useLocationStore();

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission('denied');
      return;
    }

    setPermission('requesting');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermission('granted');
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setPermission('denied');
        // fallback to manual — caller should show map picker
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setCoords, setPermission]);

  return {
    coords,
    address,
    isManual,
    permissionState,
    requestGPS,
    setManualLocation,
    setAddress,
    clearLocation,
    hasLocation: !!coords,
  };
}
