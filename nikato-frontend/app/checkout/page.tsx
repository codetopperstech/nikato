'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useRazorpay } from '@/hooks/useRazorpay';
import { AddressSelector, PaymentMethodSelector } from '@/components/checkout/AddressSelector';
import { CartSummary } from '@/components/cart/CartDrawer';
import { Button } from '@/components/ui';
import { toast } from '@/store/ui';
import type { Address, PaymentMethod } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, shopId, totalAmount, clearCart } = useCartStore();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  // Single ref to prevent double-clicks — reset in ALL paths
  const inFlight = useRef(false);

  const resetState = useCallback(() => {
    inFlight.current = false;
    setIsPlacing(false);
  }, []);

  const { data: addresses = [], isLoading: addrLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('addresses').select('*').eq('user_id', user!.id)
        .order('is_default', { ascending: false });
      return (data ?? []) as Address[];
    },
    enabled: !!user,
  });

  const { initiatePayment, isProcessing } = useRazorpay({
    onSuccess: useCallback((orderId: string) => {
      // Don't reset — navigate away
      clearCart();
      router.replace(`/orders/${orderId}`);
    }, [clearCart, router]),

    onFailure: useCallback((orderId: string) => {
      resetState();
      router.push(`/orders/${orderId}`);
    }, [resetState, router]),

    onDismiss: useCallback((_orderId: string) => {
      // User closed modal — reset so they can try again
      resetState();
    }, [resetState]),
  });

  const placeOrder = useCallback(async () => {
    if (inFlight.current) return; // prevent double-click
    if (!selectedAddress) { toast.error('Select a delivery address'); return; }
    if (!shopId || !items.length) { toast.error('Cart is empty'); return; }
    if (!user) { router.push('/login'); return; }

    inFlight.current = true;
    setIsPlacing(true);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          address_id: selectedAddress.id,
          payment_method: paymentMethod,
          special_instructions: specialInstructions || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Order failed');
        resetState();
        return;
      }

      if (paymentMethod === 'ONLINE' && data.razorpay_order_id && data.key_id) {
        // initiatePayment handles onSuccess/onFailure/onDismiss — each resets state
        await initiatePayment(data.order_id, data.razorpay_order_id, data.key_id, data.amount);
      } else {
        // COD
        clearCart();
        router.replace(`/orders/${data.order_id}`);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      resetState();
    }
  }, [selectedAddress, shopId, items, user, paymentMethod, specialInstructions, initiatePayment, clearCart, router, resetState]);

  const isButtonLoading = isPlacing || isProcessing;
  const total = totalAmount() + 30;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-32">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-black text-gray-900">Checkout</h1>
        {isProcessing && (
          <span className="ml-auto text-xs text-orange-500 animate-pulse font-medium">
            Processing payment…
          </span>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        <section>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">Delivery Address</h2>
          <AddressSelector
            addresses={addresses}
            selectedId={selectedAddress?.id ?? null}
            onSelect={setSelectedAddress}
            isLoading={addrLoading}
            onAddNew={() => router.push('/profile/addresses')}
          />
        </section>

        <section>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">Payment Method</h2>
          <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />
        </section>

        <section>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">Special Instructions</h2>
          <textarea
            value={specialInstructions}
            onChange={e => setSpecialInstructions(e.target.value)}
            placeholder="E.g. No onions, ring doorbell…"
            maxLength={500}
            rows={3}
            disabled={isButtonLoading}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] resize-none disabled:opacity-50"
          />
        </section>

        <section>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">Order Summary</h2>
          <CartSummary />
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={placeOrder}
            isLoading={isButtonLoading}
            disabled={isButtonLoading || !selectedAddress}
            rightIcon={<ArrowRight size={16} />}
          >
            {isProcessing
              ? 'Verifying payment…'
              : isPlacing && paymentMethod === 'ONLINE'
              ? 'Opening payment…'
              : isPlacing
              ? 'Placing order…'
              : paymentMethod === 'COD'
              ? `Place Order · ₹${total.toFixed(0)}`
              : `Proceed to Pay · ₹${total.toFixed(0)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
