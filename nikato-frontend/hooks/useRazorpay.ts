// ============================================================
// NIKATO — hooks/useRazorpay.ts
// Razorpay checkout hook — loads SDK and opens modal
// Blueprint Section 14: Payment Flow
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/ui';
import type {
  PaymentInitResponse,
  PaymentVerifyRequest,
  PaymentVerifyResponse,
} from '@/types';

interface UseRazorpayOptions {
  onSuccess: (orderId: string) => void;
  onFailure?: (orderId: string) => void;
}

export function useRazorpay({ onSuccess, onFailure }: UseRazorpayOptions) {
  const { profile } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePayment = useCallback(
    async (orderId: string, orderAmount: number) => {
      setIsProcessing(true);
      try {
        // Step 1: Get Razorpay order ID from backend
        const { data: initData, error: initError } =
          await supabase.functions.invoke<PaymentInitResponse>('payment-init', {
            body: { order_id: orderId },
          });

        if (initError || !initData) {
          throw new Error('Failed to initiate payment');
        }

        // Step 2: Open Razorpay checkout
        await openRazorpayCheckout({
          key: initData.key_id,
          amount: Math.round(orderAmount * 100), // paise
          currency: 'INR',
          name: 'NIKATO',
          description: 'Hyperlocal Delivery',
          order_id: initData.razorpay_order_id,
          prefill: {
            name: profile?.full_name ?? '',
            contact: profile?.phone ?? '',
            email: profile?.email ?? '',
          },
          theme: { color: '#FF6B35' },
          handler: async (response) => {
            // Step 3: Verify payment on backend
            const { data: verifyData, error: verifyError } =
              await supabase.functions.invoke<PaymentVerifyResponse>(
                'payment-verify',
                {
                  body: {
                    order_id: orderId,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  } satisfies PaymentVerifyRequest,
                }
              );

            if (verifyError || !verifyData?.success) {
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
        toast.error('Payment failed', 'Please try again');
        setIsProcessing(false);
      }
    },
    [profile, onSuccess, onFailure]
  );

  return { initiatePayment, isProcessing };
}
