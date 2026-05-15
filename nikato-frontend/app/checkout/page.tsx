'use client';
import { useState } from 'react';
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

  const { data: addresses = [], isLoading: addrLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('addresses').select('*').eq('user_id', user!.id).order('is_default', { ascending: false });
      return (data ?? []) as Address[];
    },
    enabled: !!user,
  });

  const { initiatePayment, isProcessing } = useRazorpay({
    onSuccess: (orderId) => { clearCart(); router.push(`/orders/${orderId}`); },
    onFailure: (orderId) => { router.push(`/orders/${orderId}`); },
  });

  const placeOrder = async () => {
    if (!selectedAddress) { toast.error('Select a delivery address'); return; }
    if (!shopId) { toast.error('Cart is empty'); return; }
    if (!user) { router.push('/login'); return; }

    setIsPlacing(true);
    try {
      // ✅ Use Next.js API route — no CORS, no edge fn issues
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
        toast.error('Order failed', data.error ?? 'Something went wrong');
        return;
      }

      if (paymentMethod === 'ONLINE' && data.razorpay_order_id) {
        await initiatePayment(data.order_id, totalAmount());
      } else {
        clearCart();
        router.push(`/orders/${data.order_id}`);
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-32">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-700" /></button>
        <h1 className="text-lg font-black text-gray-900">Checkout</h1>
      </div>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        <section>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">Delivery Address</h2>
          <AddressSelector addresses={addresses} selectedId={selectedAddress?.id ?? null} onSelect={setSelectedAddress} isLoading={addrLoading} onAddNew={() => router.push('/profile/addresses')} />
        </section>
        <section>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">Payment Method</h2>
          <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />
        </section>
        <section>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">Special Instructions</h2>
          <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} placeholder="E.g. No onions, extra napkins…" maxLength={500} rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] resize-none" />
        </section>
        <section>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">Order Summary</h2>
          <CartSummary />
        </section>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto">
          <Button variant="primary" size="lg" className="w-full" onClick={placeOrder} isLoading={isPlacing || isProcessing} disabled={!selectedAddress} rightIcon={<ArrowRight size={16} />}>
            {paymentMethod === 'COD' ? 'Place Order' : 'Proceed to Pay'} · ₹{(totalAmount() + 30).toFixed(0)}
          </Button>
        </div>
      </div>
    </div>
  );
}
