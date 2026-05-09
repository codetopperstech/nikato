'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { CartSummary } from '@/components/cart/CartDrawer';
import { Button, EmptyState } from '@/components/ui';
import { formatPrice, cn } from '@/lib/utils';

export default function CartPage() {
  const { items, shopName, itemCount, totalAmount, updateQty, clearCart } = useCartStore();
  const count = itemCount();

  if (count === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-6">
        <EmptyState
          icon={<ShoppingBag size={56} className="text-gray-200" />}
          title="Your cart is empty"
          description="Add items from a nearby shop to get started"
          action={<Link href="/shops"><Button variant="primary">Browse shops</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-32">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/shops" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-gray-900">Your Cart</h1>
          {shopName && <p className="text-xs text-gray-500">From {shopName}</p>}
        </div>
        <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
          <Trash2 size={12} /> Clear
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {items.map((item) => (
          <div key={item.product_id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
            {item.product_image && (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative bg-gray-100">
                <Image src={item.product_image} alt={item.product_name} fill className="object-cover" sizes="64px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className={cn('w-3 h-3 rounded-sm border-2 flex items-center justify-center flex-shrink-0', item.is_veg ? 'border-green-600' : 'border-red-600')}>
                  <div className={cn('w-1.5 h-1.5 rounded-full', item.is_veg ? 'bg-green-600' : 'bg-red-600')} />
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
              <p className="text-xs text-gray-400">{formatPrice(item.price)} each</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateQty(item.product_id, item.quantity - 1)}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
              >
                {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
              </button>
              <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.product_id, item.quantity + 1)}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        ))}
        <CartSummary />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto">
          <Link href="/checkout">
            <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight size={16} />}>
              Checkout · {formatPrice(totalAmount())}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
