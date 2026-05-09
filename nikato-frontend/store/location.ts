// ============================================================
// NIKATO — store/location.ts
// Location state: GPS coords, manual input, permissions
// Blueprint Section 17: State Management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Coords } from '@/types';

type PermissionState = 'unknown' | 'granted' | 'denied' | 'requesting';

interface LocationState {
  coords: Coords | null;
  address: string | null;
  isManual: boolean;
  permissionState: PermissionState;

  setCoords: (coords: Coords) => void;
  setAddress: (address: string) => void;
  setIsManual: (isManual: boolean) => void;
  setPermission: (state: PermissionState) => void;
  setManualLocation: (lat: number, lng: number, address?: string) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      coords: null,
      address: null,
      isManual: false,
      permissionState: 'unknown',

      setCoords: (coords) => set({ coords, isManual: false }),
      setAddress: (address) => set({ address }),
      setIsManual: (isManual) => set({ isManual }),
      setPermission: (permissionState) => set({ permissionState }),

      setManualLocation: (lat, lng, address) =>
        set({
          coords: { lat, lng },
          address: address ?? null,
          isManual: true,
        }),

      clearLocation: () =>
        set({
          coords: null,
          address: null,
          isManual: false,
          permissionState: 'unknown',
        }),
    }),
    {
      name: 'nikato-location',
    }
  )
);
