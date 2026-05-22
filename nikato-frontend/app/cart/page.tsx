'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { items, shopName, updateQty, removeItem, totalAmount, itemCount } = useCartStore();
  const total = totalAmount();
  const count = itemCount();
  const deliveryFee = 30;

  if (count === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F9FBF8' }}>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: '#edfbdc' }}>
        <ShoppingBag size={36} style={{ color: '#5cb83a' }} />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-400 text-sm mb-6 text-center">Add items from a nearby shop to get started.</p>
      <Link href="/shops" className="px-8 py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95" style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.3)' }}>
        Browse shops
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen pb-32" style={{ background: '#F9FBF8' }}>
      <div className="sticky top-14 z-10 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-base font-black text-gray-900">My Cart</h1>
          <p className="text-xs text-gray-400">{shopName}</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#edfbdc', color: '#3a8a1f' }}>{count} items</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {items.map(item => (
          <div key={item.product_id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-card">
            <div className="w-14 h-14 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.product_image ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" /> : <span className="text-xl">🛒</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{item.product_name}</p>
              <p className="font-black text-sm mt-0.5" style={{ color: '#3a8a1f' }}>{formatPrice(item.price)}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => item.quantity === 1 ? removeItem(item.product_id) : updateQty(item.product_id, item.quantity - 1)}
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: item.quantity === 1 ? '#fee2e2' : '#edfbdc', color: item.quantity === 1 ? '#ef4444' : '#5cb83a' }}>
                {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
              </button>
              <span className="w-7 text-center font-black text-sm">{item.quantity}</span>
              <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90" style={{ background: '#edfbdc', color: '#5cb83a' }}>
                <Plus size={13} />
              </button>
            </div>
            <p className="font-black text-sm text-gray-900 flex-shrink-0 w-14 text-right">{formatPrice(item.price * item.quantity)}</p>
          </div>
        ))}

        {/* Bill */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Delivery fee</span><span>{formatPrice(deliveryFee)}</span></div>
            <div className="flex justify-between font-black text-gray-900 text-base pt-2.5 border-t border-gray-100 mt-1">
              <span>Total</span><span>{formatPrice(total + deliveryFee)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100" style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={() => router.push('/checkout')} className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-between px-5 transition-all active:scale-[0.98]" style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.35)' }}>
            <span>{count} items</span>
            <span className="flex items-center gap-1.5">Proceed to Checkout <ArrowRight size={15} /></span>
            <span>{formatPrice(total + deliveryFee)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
