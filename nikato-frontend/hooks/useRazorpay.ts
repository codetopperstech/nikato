'use client';
import { useRef, useCallback, useState } from 'react';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/ui';

interface UseRazorpayOptions {
  onSuccess: (orderId: string) => void;
  onFailure?: (orderId: string) => void;
  onDismiss?: () => void;
}

export function useRazorpay({ onSuccess, onFailure, onDismiss }: UseRazorpayOptions) {
  const { profile } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  // ✅ Prevent duplicate payment initiations
  const inFlightRef = useRef(false);

  const initiatePayment = useCallback(async (
    orderId: string,
    razorpayOrderId: string,
    keyId: string,
    amountPaise: number,
  ) => {
    if (inFlightRef.current) return; // ✅ guard duplicate calls
    inFlightRef.current = true;
    setIsProcessing(true);

    try {
      // ✅ Now properly awaitable — resolves on success, rejects on dismiss/error
      const response = await openRazorpayCheckout({
        key: keyId,
        amount: amountPaise,
        currency: 'INR',
        name: 'NIKATO',
        description: 'Hyperlocal Delivery',
        order_id: razorpayOrderId,
        prefill: {
          name: profile?.full_name ?? '',
          contact: (profile?.phone as string) ?? '',
          email: (profile?.email as string) ?? '',
        },
        theme: { color: '#FF6B35' },
      });

      // ✅ Payment captured — verify signature server-side
      const res = await fetch('/api/orders/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error('Payment verification failed', 'Contact support with order ID: ' + orderId);
        onFailure?.(orderId);
      } else {
        onSuccess(orderId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'PAYMENT_CANCELLED') {
        // ✅ User dismissed modal — do NOT show error, just reset
        toast.info('Payment cancelled', 'Your order is saved. You can pay later from Orders.');
        onDismiss?.();
      } else {
        toast.error('Payment failed', 'Please try again or use Cash on Delivery.');
        onFailure?.(orderId);
      }
    } finally {
      setIsProcessing(false);
      inFlightRef.current = false;
    }
  }, [profile, onSuccess, onFailure, onDismiss]);

  return { initiatePayment, isProcessing };
}
