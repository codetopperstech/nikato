import { create } from 'zustand';
import type { Order, OrderStatus, Shop } from '@/types';

interface ShopState {
  shopData: Shop | null;
  isOpen: boolean;
  pendingOrders: Order[];

  setShop: (shop: Shop) => void;
  setIsOpen: (isOpen: boolean) => void;
  setPendingOrders: (orders: Order[]) => void;
  addPendingOrder: (order: Order) => void;
  removePendingOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  reset: () => void;
}

export const useShopStore = create<ShopState>()((set, get) => ({
  shopData: null,
  isOpen: false,
  pendingOrders: [],

  setShop: (shopData) => set({ shopData, isOpen: shopData.is_open }),
  setIsOpen: (isOpen) => set({ isOpen }),

  // ✅ Dedupe on set
  setPendingOrders: (orders) => {
    const seen = new Set<string>();
    const deduped = orders.filter((o) => { if (seen.has(o.id)) return false; seen.add(o.id); return true; });
    set({ pendingOrders: deduped });
  },

  // ✅ Dedupe on add
  addPendingOrder: (order) => {
    const existing = get().pendingOrders;
    if (existing.some((o) => o.id === order.id)) return;
    set({ pendingOrders: [order, ...existing] });
  },

  removePendingOrder: (orderId) =>
    set({ pendingOrders: get().pendingOrders.filter((o) => o.id !== orderId) }),

  // ✅ Update status in pending queue
  updateOrderStatus: (orderId, status) => {
    if (status !== 'pending') {
      set({ pendingOrders: get().pendingOrders.filter((o) => o.id !== orderId) });
    } else {
      set({ pendingOrders: get().pendingOrders.map((o) => o.id === orderId ? { ...o, status } : o) });
    }
  },

  reset: () => set({ shopData: null, isOpen: false, pendingOrders: [] }),
}));
