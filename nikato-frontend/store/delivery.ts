// ============================================================
// NIKATO — store/delivery.ts
// Delivery partner state
// Blueprint Section 17: State Management
// ============================================================

import { create } from 'zustand';
import type { Order } from '@/types';

interface DeliveryState {
  isOnline: boolean;
  currentDelivery: Order | null;
  earnings: {
    today: number;
    week: number;
    month: number;
  };

  setOnline: (online: boolean) => void;
  setCurrentDelivery: (order: Order | null) => void;
  setEarnings: (earnings: DeliveryState['earnings']) => void;
  reset: () => void;
}

export const useDeliveryStore = create<DeliveryState>()((set) => ({
  isOnline: false,
  currentDelivery: null,
  earnings: { today: 0, week: 0, month: 0 },

  setOnline: (isOnline) => set({ isOnline }),
  setCurrentDelivery: (currentDelivery) => set({ currentDelivery }),
  setEarnings: (earnings) => set({ earnings }),
  reset: () =>
    set({ isOnline: false, currentDelivery: null, earnings: { today: 0, week: 0, month: 0 } }),
}));
