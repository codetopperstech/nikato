// supabase/functions/payment-verify/index.ts
// Verifies Razorpay HMAC signature and updates order + payment status

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { getAdminClient } from "../_shared/supabase.ts";
import { verifyPaymentSignature } from "../_shared/razorpay.ts";

interface PaymentVerifyRequest {
  order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authError } = await requireAuth(req);
  if (authError) return authError;

  try {
    const body: PaymentVerifyRequest = await req.json();
    const { order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse("VALIDATION_ERROR", "order_id, razorpay_payment_id, and razorpay_signature are required.");
    }

    const supabase = getAdminClient();

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, customer_id, razorpay_order_id, payment_status, total_amount")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return errorResponse("ORDER_NOT_FOUND", "Order not found.", 404);
    }

    if (order.customer_id !== user!.id) {
      return errorResponse("FORBIDDEN", "You do not own this order.", 403);
    }

    if (order.payment_status === "paid") {
      // Idempotent — already processed
      return successResponse({ success: true, already_verified: true });
    }

    if (!order.razorpay_order_id) {
      return errorResponse("VALIDATION_ERROR", "No Razorpay order associated with this order.", 400);
    }

    // Verify HMAC-SHA256 signature
    const isValid = await verifyPaymentSignature(
      order.razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      // Mark payment as failed
      await supabase
        .from("payments")
        .update({ status: "failed", razorpay_payment_id })
        .eq("razorpay_order_id", order.razorpay_order_id);

      await supabase
        .from("orders")
        .update({ status: "cancelled", payment_status: "failed" })
        .eq("id", order_id);

      return errorResponse("PAYMENT_FAILED", "Payment signature verification failed.", 400);
    }

    // Signature valid — mark payment captured
    await supabase
      .from("payments")
      .update({
        status: "captured",
        razorpay_payment_id,
        razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", order.razorpay_order_id);

    // Update order payment status
    await supabase
      .from("orders")
      .update({
        razorpay_payment_id,
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    // Trigger delivery assignment
    const assignUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/assign-delivery`;
    fetch(assignUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ order_id }),
    }).catch((e) => console.error("assign-delivery trigger failed:", e));

    return successResponse({ success: true });
  } catch (err) {
    console.error("payment-verify error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to verify payment.", 500);
  }
});
