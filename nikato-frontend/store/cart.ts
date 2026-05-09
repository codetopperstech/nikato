// ============================================================
// NIKATO — store/cart.ts
// Cart state — enforces single-shop rule (Blueprint Section 17)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

export class CrossShopCartError extends Error {
  constructor() {
    super('CROSS_SHOP_CART');
    this.name = 'CrossShopCartError';
  }
}

interface CartState {
  items: CartItem[];
  shopId: string | null;
  shopName: string | null;

  // Derived
  itemCount: () => number;
  totalAmount: () => number;
  hasItem: (productId: string) => boolean;
  getItemQty: (productId: string) => number;

  // Mutations
  addItem: (product: Product, shopId: string, shopName: string) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shopId: null,
      shopName: null,

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      hasItem: (productId) => get().items.some((i) => i.product_id === productId),
      getItemQty: (productId) =>
        get().items.find((i) => i.product_id === productId)?.quantity ?? 0,

      addItem: (product, shopId, shopName) => {
        const state = get();

        // CRITICAL: Enforce single-shop cart rule
        if (state.shopId && state.shopId !== shopId) {
          throw new CrossShopCartError();
        }

        const existingIndex = state.items.findIndex(
          (i) => i.product_id === product.id
        );

        if (existingIndex >= 0) {
          const updatedItems = [...state.items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + 1,
          };
          set({ items: updatedItems });
        } else {
          set({
            shopId,
            shopName,
            items: [
              ...state.items,
              {
                product_id: product.id,
                product_name: product.name,
                product_image: product.image_url,
                price: product.price,
                quantity: 1,
                unit: product.unit,
                is_veg: product.is_veg,
              },
            ],
          });
        }
      },

      removeItem: (productId) => {
        const updatedItems = get().items.filter(
          (i) => i.product_id !== productId
        );
        set({
          items: updatedItems,
          shopId: updatedItems.length === 0 ? null : get().shopId,
          shopName: updatedItems.length === 0 ? null : get().shopName,
        });
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        const updatedItems = get().items.map((i) =>
          i.product_id === productId ? { ...i, quantity: qty } : i
        );
        set({ items: updatedItems });
      },

      clearCart: () => set({ items: [], shopId: null, shopName: null }),
    }),
    {
      name: 'nikato-cart',
    }
  )
);
