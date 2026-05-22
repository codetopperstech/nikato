'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, CreditCard, Banknote, Plus, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useRazorpay } from '@/hooks/useRazorpay';
import { AddressSelector, PaymentMethodSelector } from '@/components/checkout/AddressSelector';
import { CartSummary } from '@/components/cart/CartDrawer';
import { Spinner } from '@/components/ui';
import { toast } from '@/store/ui';
import { formatPrice } from '@/lib/utils';
import type { Address, PaymentMethod } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, shopId, shopName, totalAmount, clearCart } = useCartStore();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const inFlight = useRef(false);

  const resetState = useCallback(() => { inFlight.current = false; setIsPlacing(false); }, []);

  const { data: addresses = [], isLoading: addrLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('addresses').select('*').eq('user_id', user!.id).order('is_default', { ascending: false });
      return (data ?? []) as Address[];
    },
    enabled: !!user,
  });

  const { initiatePayment, isProcessing } = useRazorpay({
    onSuccess: useCallback((orderId: string) => { clearCart(); router.replace(`/orders/${orderId}`); }, [clearCart, router]),
    onFailure: useCallback((orderId: string) => { resetState(); router.push(`/orders/${orderId}`); }, [resetState, router]),
    onDismiss: useCallback((_orderId: string) => { resetState(); }, [resetState]),
  });

  const placeOrder = useCallback(async () => {
    if (inFlight.current) return;
    if (!selectedAddress) { toast.error('Select a delivery address'); return; }
    if (!shopId || !items.length) { toast.error('Cart is empty'); return; }
    if (!user) { router.push('/login'); return; }
    inFlight.current = true; setIsPlacing(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })), address_id: selectedAddress.id, payment_method: paymentMethod, special_instructions: specialInstructions || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Order failed'); resetState(); return; }
      if (paymentMethod === 'ONLINE' && data.razorpay_order_id && data.key_id) {
        await initiatePayment(data.order_id, data.razorpay_order_id, data.key_id, data.amount);
      } else { clearCart(); router.replace(`/orders/${data.order_id}`); }
    } catch { toast.error('Something went wrong. Please try again.'); resetState(); }
  }, [selectedAddress, shopId, items, user, paymentMethod, specialInstructions, initiatePayment, clearCart, router, resetState]);

  const isButtonLoading = isPlacing || isProcessing;
  const subtotal = totalAmount();
  const delivery = 30;
  const total = subtotal + delivery;

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9FBF8' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-surface-2 transition-colors"><ArrowLeft size={20} className="text-gray-700" /></button>
        <h1 className="text-base font-black text-gray-900 flex-1">Checkout</h1>
        {isProcessing && <span className="text-xs font-semibold animate-pulse" style={{ color: '#5cb83a' }}>Processing…</span>}
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Shop info */}
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-card">
          <span className="text-base">🏪</span>
          <span className="font-semibold text-gray-700">{shopName}</span>
          <span className="ml-auto text-xs text-gray-400">{items.length} items</span>
        </div>

        {/* Address section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: '#7ED957' }}>1</div>
            <h2 className="text-sm font-black text-gray-900">Delivery Address</h2>
          </div>
          {addrLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-surface-2" />
              <div className="space-y-2 flex-1"><div className="h-3 bg-surface-2 rounded w-1/2" /><div className="h-2 bg-surface-2 rounded w-3/4" /></div>
            </div>
          ) : addresses.length === 0 ? (
            <button onClick={() => router.push('/profile/addresses')} className="w-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-4 flex items-center gap-3 hover:border-brand transition-colors text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#edfbdc' }}><Plus size={18} style={{ color: '#5cb83a' }} /></div>
              <div><p className="text-sm font-semibold text-gray-700">Add delivery address</p><p className="text-xs text-gray-400 mt-0.5">Required for delivery</p></div>
            </button>
          ) : (
            <div className="space-y-2">
              {addresses.map(addr => (
                <button key={addr.id} onClick={() => setSelectedAddress(addr)}
                  className={`w-full bg-white rounded-2xl border-[1.5px] p-4 flex items-start gap-3 text-left transition-all ${selectedAddress?.id === addr.id ? 'border-brand shadow-brand/10 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedAddress?.id === addr.id ? '' : 'bg-surface-2'}`} style={selectedAddress?.id === addr.id ? { background: '#edfbdc' } : {}}>
                    <MapPin size={16} style={selectedAddress?.id === addr.id ? { color: '#5cb83a' } : { color: '#9ca3af' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{addr.label || 'Address'}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{addr.address_line}, {addr.city} - {addr.pincode}</p>
                  </div>
                  {selectedAddress?.id === addr.id && <Check size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#5cb83a' }} />}
                </button>
              ))}
              <button onClick={() => router.push('/profile/addresses')} className="w-full flex items-center gap-2 p-3 text-sm font-semibold rounded-xl hover:bg-surface-2 transition-colors" style={{ color: '#5cb83a' }}>
                <Plus size={14} /> Add new address
              </button>
            </div>
          )}
        </section>

        {/* Payment section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: '#7ED957' }}>2</div>
            <h2 className="text-sm font-black text-gray-900">Payment Method</h2>
          </div>
          <div className="space-y-2">
            {([
              { value: 'ONLINE', icon: CreditCard, label: 'Pay Online', sub: 'UPI, Card, Net Banking via Razorpay' },
              { value: 'COD', icon: Banknote, label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
            ] as const).map(({ value, icon: Icon, label, sub }) => (
              <button key={value} onClick={() => setPaymentMethod(value)}
                className={`w-full bg-white rounded-2xl border-[1.5px] p-4 flex items-center gap-3 text-left transition-all ${paymentMethod === value ? 'border-brand' : 'border-gray-100 hover:border-gray-200'}`}
                style={paymentMethod === value ? { boxShadow: '0 0 0 3px rgba(126,217,87,0.12)' } : {}}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`} style={{ background: paymentMethod === value ? '#edfbdc' : '#f9fafb' }}>
                  <Icon size={18} style={paymentMethod === value ? { color: '#5cb83a' } : { color: '#9ca3af' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
                {paymentMethod === value && <Check size={16} className="flex-shrink-0" style={{ color: '#5cb83a' }} />}
              </button>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: '#7ED957' }}>3</div>
            <h2 className="text-sm font-black text-gray-900">Special Instructions <span className="font-normal text-gray-400">(optional)</span></h2>
          </div>
          <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
            placeholder="E.g. No onions, ring doorbell…" maxLength={500} rows={2} disabled={isButtonLoading}
            className="w-full rounded-2xl border-[1.5px] border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 resize-none transition-all disabled:opacity-50 bg-white" />
        </section>

        {/* Bill summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal ({items.length} items)</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Delivery fee</span><span>{formatPrice(delivery)}</span></div>
            <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100 mt-1">
              <span>To Pay</span><span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Place order CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100" style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={placeOrder} disabled={isButtonLoading || !selectedAddress}
            className="w-full py-4 rounded-2xl font-black text-white text-sm flex items-center justify-between px-5 transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.4)' }}>
            <span className="text-xs font-semibold opacity-80">{items.length} items</span>
            {isButtonLoading ? (
              <span className="flex items-center gap-2"><Spinner size="sm" className="text-white" />{isProcessing ? 'Verifying…' : 'Placing…'}</span>
            ) : (
              <span>{paymentMethod === 'COD' ? 'Place Order' : 'Proceed to Pay'}</span>
            )}
            <span className="font-black">{formatPrice(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
