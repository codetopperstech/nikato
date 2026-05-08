// supabase/functions/_shared/razorpay.ts
// Razorpay API helpers for Edge Functions

const RAZORPAY_API = "https://api.razorpay.com/v1";

function getAuthHeader(): string {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  return "Basic " + btoa(`${keyId}:${keySecret}`);
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number; // in paise
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
}

/** Create a Razorpay order */
export async function createRazorpayOrder(params: {
  amount: number; // in paise
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const resp = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      notes: params.notes ?? {},
    }),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(`Razorpay order creation failed: ${JSON.stringify(err)}`);
  }

  return resp.json();
}

/** Verify Razorpay HMAC-SHA256 payment signature */
export async function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): Promise<boolean> {
  const secret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const message = `${razorpayOrderId}|${razorpayPaymentId}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  const computed = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === signature;
}

/** Verify Razorpay webhook signature */
export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );

  const computed = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === signature;
}
