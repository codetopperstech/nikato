// supabase/functions/payment-init/index.ts
// Creates a Razorpay order for an existing NIKATO order

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { getAdminClient } from "../_shared/supabase.ts";
import { createRazorpayOrder } from "../_shared/razorpay.ts";

interface PaymentInitRequest {
  order_id: string;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authError } = await requireAuth(req);
  if (authError) return authError;

  try {
    const { order_id }: PaymentInitRequest = await req.json();

    if (!order_id) {
      return errorResponse("VALIDATION_ERROR", "order_id is required.");
    }

    const supabase = getAdminClient();

    // Fetch order — must belong to this customer
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, payment_method, payment_status, customer_id, razorpay_order_id")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return errorResponse("ORDER_NOT_FOUND", "Order not found.", 404);
    }

    if (order.customer_id !== user!.id) {
      return errorResponse("FORBIDDEN", "You do not own this order.", 403);
    }

    if (order.payment_method !== "ONLINE") {
      return errorResponse("VALIDATION_ERROR", "This is a COD order.", 400);
    }

    if (order.payment_status === "paid") {
      return errorResponse("CONFLICT", "Order is already paid.", 409);
    }

    // If Razorpay order already exists, return it (idempotent)
    if (order.razorpay_order_id) {
      return successResponse({
        razorpay_order_id: order.razorpay_order_id,
        key_id: Deno.env.get("RAZORPAY_KEY_ID"),
        amount: Math.round(Number(order.total_amount) * 100),
        currency: "INR",
        order_number: order.order_number,
      });
    }

    // Create new Razorpay order
    const rzpOrder = await createRazorpayOrder({
      amount: Math.round(Number(order.total_amount) * 100),
      receipt: order.order_number,
      notes: { order_id: order.id },
    });

    // Save Razorpay order ID and create payment record
    await supabase
      .from("orders")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", order_id);

    const { error: paymentErr } = await supabase.from("payments").insert({
      order_id: order.id,
      razorpay_order_id: rzpOrder.id,
      amount: order.total_amount,
      currency: "INR",
      status: "created",
    });

    if (paymentErr) {
      console.error("Payment record insert error:", paymentErr);
    }

    return successResponse({
      razorpay_order_id: rzpOrder.id,
      key_id: Deno.env.get("RAZORPAY_KEY_ID"),
      amount: Math.round(Number(order.total_amount) * 100),
      currency: "INR",
      order_number: order.order_number,
    });
  } catch (err) {
    console.error("payment-init error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to initiate payment.", 500);
  }
});
