declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open(): void;
  close(): void;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Opens Razorpay modal and returns a Promise that resolves on success
 * or rejects on dismiss/failure. This is the KEY fix — caller can await it.
 */
export function openRazorpayCheckout(options: Omit<RazorpayOptions, 'handler' | 'modal'>): Promise<RazorpaySuccessResponse> {
  return new Promise(async (resolve, reject) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) { reject(new Error('Failed to load Razorpay SDK')); return; }

    const rzp = new window.Razorpay({
      ...options,
      handler: (response) => resolve(response),   // ✅ resolves promise on payment success
      modal: {
        ondismiss: () => reject(new Error('PAYMENT_CANCELLED')), // ✅ rejects on dismiss
      },
    });
    rzp.open();
  });
}
