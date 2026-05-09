// ============================================================
// NIKATO — store/ui.ts
// UI state: toasts, modals, sidebar, overlays
// Blueprint Section 17: State Management
// ============================================================

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface UIState {
  toasts: Toast[];
  isCartOpen: boolean;
  isSidebarOpen: boolean;
  isCrossShopModalOpen: boolean;
  pendingProduct: { productId: string; shopId: string; shopName: string } | null;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  setCartOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setCrossShopModal: (
    open: boolean,
    pending?: UIState['pendingProduct']
  ) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>()((set) => ({
  toasts: [],
  isCartOpen: false,
  isSidebarOpen: false,
  isCrossShopModalOpen: false,
  pendingProduct: null,

  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    // Auto-remove after 4s
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),

  setCartOpen: (isCartOpen) => set({ isCartOpen }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setCrossShopModal: (open, pending = null) =>
    set({ isCrossShopModalOpen: open, pendingProduct: pending }),
}));

// ── Convenience helpers ──────────────────────────────────────

export const toast = {
  success: (title: string, description?: string) =>
    useUIStore.getState().addToast({ variant: 'success', title, description }),
  error: (title: string, description?: string) =>
    useUIStore.getState().addToast({ variant: 'error', title, description }),
  warning: (title: string, description?: string) =>
    useUIStore.getState().addToast({ variant: 'warning', title, description }),
  info: (title: string, description?: string) =>
    useUIStore.getState().addToast({ variant: 'info', title, description }),
};
