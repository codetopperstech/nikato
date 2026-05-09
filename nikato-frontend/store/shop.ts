// ============================================================
// NIKATO — store/shop.ts
// Shop owner state: shopData, isOpen, pendingOrders
// Blueprint Section 17: State Management
// ============================================================

import { create } from 'zustand';
import type { Order, Shop } from '@/types';

interface ShopState {
  shopData: Shop | null;
  isOpen: boolean;
  pendingOrders: Order[];

  setShop: (shop: Shop) => void;
  setIsOpen: (isOpen: boolean) => void;
  setPendingOrders: (orders: Order[]) => void;
  addPendingOrder: (order: Order) => void;
  removePendingOrder: (orderId: string) => void;
  reset: () => void;
}

export const useShopStore = create<ShopState>()((set, get) => ({
  shopData: null,
  isOpen: false,
  pendingOrders: [],

  setShop: (shopData) => set({ shopData, isOpen: shopData.is_open }),
  setIsOpen: (isOpen) => set({ isOpen }),
  setPendingOrders: (pendingOrders) => set({ pendingOrders }),
  addPendingOrder: (order) =>
    set({ pendingOrders: [order, ...get().pendingOrders] }),
  removePendingOrder: (orderId) =>
    set({ pendingOrders: get().pendingOrders.filter((o) => o.id !== orderId) }),
  reset: () => set({ shopData: null, isOpen: false, pendingOrders: [] }),
}));
