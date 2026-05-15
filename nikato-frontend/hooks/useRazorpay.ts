'use client';
import { useState, useCallback } from 'react';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/ui';

interface UseRazorpayOptions {
  onSuccess: (orderId: string) => void;
  onFailure?: (orderId: string) => void;
}

// Called with the full data from /api/orders/create response
export function useRazorpay({ onSuccess, onFailure }: UseRazorpayOptions) {
  const { profile } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePayment = useCallback(
    async (
      orderId: string,
      razorpayOrderId: string,
      keyId: string,
      amountPaise: number
    ) => {
      setIsProcessing(true);
      try {
        await openRazorpayCheckout({
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
          handler: async (response) => {
            // Verify payment via Next.js API route
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
              toast.error('Payment verification failed', 'Please contact support');
              onFailure?.(orderId);
            } else {
              toast.success('Payment successful!');
              onSuccess(orderId);
            }
            setIsProcessing(false);
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              toast.info('Payment cancelled');
            },
          },
        });
      } catch (err) {
        console.error('Razorpay error:', err);
        toast.error('Payment failed. Please try again.');
        setIsProcessing(false);
      }
    },
    [profile, onSuccess, onFailure]
  );

  return { initiatePayment, isProcessing };
}
