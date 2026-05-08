// supabase/functions/razorpay-webhook/index.ts
// Handles Razorpay webhook events (payment.captured, payment.failed, refund.created)
// This is a backup verification path — primary verification is in payment-verify

import { getAdminClient } from "../_shared/supabase.ts";
import { verifyWebhookSignature } from "../_shared/razorpay.ts";

Deno.serve(async (req: Request) => {
  // Webhooks come as POST with no CORS pre-flight
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response("Forbidden", { status: 403 });
    }

    const event = JSON.parse(body);
    const supabase = getAdminClient();

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        // Update payment record
        const { error } = await supabase
          .from("payments")
          .update({
            status: "captured",
            razorpay_payment_id: payment.id,
            gateway_response: payment,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", payment.order_id);

        if (!error) {
          // Ensure order is marked paid (idempotent)
          await supabase
            .from("orders")
            .update({ payment_status: "paid", razorpay_payment_id: payment.id })
            .eq("razorpay_order_id", payment.order_id)
            .neq("payment_status", "paid"); // avoid unnecessary updates
        }
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;

        await supabase
          .from("payments")
          .update({
            status: "failed",
            razorpay_payment_id: payment.id,
            gateway_response: payment,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", payment.order_id);

        // Cancel order and restore stock
        const { data: order } = await supabase
          .from("orders")
          .update({
            status: "cancelled",
            payment_status: "failed",
            cancelled_reason: "Payment failed",
          })
          .eq("razorpay_order_id", payment.order_id)
          .select("id")
          .single();

        if (order?.id) {
          await restoreStock(supabase, order.id);
        }
        break;
      }

      case "refund.created": {
        const refund = event.payload.refund.entity;
        // Update order payment_status to refunded
        await supabase
          .from("orders")
          .update({ payment_status: "refunded" })
          .eq("razorpay_order_id", refund.payment_id); // approximation
        break;
      }

      default:
        console.log("Unhandled webhook event:", event.event);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("razorpay-webhook error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});

// deno-lint-ignore no-explicit-any
async function restoreStock(supabase: any, orderId: string): Promise<void> {
  try {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);

    if (!items) return;

    for (const item of items) {
      await supabase.rpc("restore_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }
  } catch (e) {
    console.error("restore stock error:", e);
  }
}
