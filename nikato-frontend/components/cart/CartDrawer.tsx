// ============================================================
// NIKATO — components/cart/CartDrawer.tsx
// Slide-in cart panel with items and summary
// Blueprint Section 07
// ============================================================

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { Button } from '@/components/ui';
import { formatPrice, cn } from '@/lib/utils';

// ── CartItem ──────────────────────────────────────────────────

function CartItem({ item }: { item: ReturnType<typeof useCartStore>['items'][0] }) {
  const { updateQty, removeItem } = useCartStore();

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 relative">
        {item.product_image ? (
          <Image
            src={item.product_image}
            alt={item.product_name}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-2xl">🛍️</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <div
            className={cn(
              'w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0',
              item.is_veg ? 'border-green-600' : 'border-red-600'
            )}
          >
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                item.is_veg ? 'bg-green-600' : 'bg-red-600'
              )}
            />
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.product_name}
          </p>
        </div>
        <p className="text-sm font-bold text-gray-900">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQty(item.product_id, item.quantity - 1)}
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
        >
          {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
        </button>
        <span className="w-6 text-center text-sm font-bold text-gray-900">
          {item.quantity}
        </span>
        <button
          onClick={() => updateQty(item.product_id, item.quantity + 1)}
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

// ── CartSummary ───────────────────────────────────────────────

export function CartSummary({
  deliveryFee = 0,
  discount = 0,
}: {
  deliveryFee?: number;
  discount?: number;
}) {
  const { totalAmount } = useCartStore();
  const subtotal = totalAmount();
  const total = subtotal + deliveryFee - discount;

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Delivery fee</span>
        <span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount</span>
          <span>-{formatPrice(discount)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}

// ── CartDrawer ────────────────────────────────────────────────

export function CartDrawer() {
  const { items, shopName, itemCount, totalAmount, clearCart } = useCartStore();
  const { isCartOpen, setCartOpen } = useUIStore();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCartOpen]);

  const count = itemCount();

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col',
          'transition-transform duration-300',
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#FF6B35]" />
            <h2 className="font-bold text-gray-900">
              Your Cart
              {count > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({count} {count === 1 ? 'item' : 'items'})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shop name */}
        {shopName && (
          <div className="px-4 py-2 bg-orange-50 text-xs text-orange-700 font-medium">
            From {shopName}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShoppingBag size={48} className="text-gray-200" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400">
                Add items from a nearby shop to get started
              </p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <CartItem key={item.product_id} item={item} />
              ))}

              <div className="mt-4">
                <CartSummary />
              </div>

              <button
                onClick={clearCart}
                className="mt-3 text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={12} />
                Clear cart
              </button>
            </>
          )}
        </div>

        {/* Footer CTA */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <Link href="/checkout" onClick={() => setCartOpen(false)}>
              <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight size={16} />}>
                Proceed to Checkout · {formatPrice(totalAmount())}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
