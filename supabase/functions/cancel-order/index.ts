// supabase/functions/cancel-order/index.ts
// Cancels an order, restores stock, triggers refund if paid

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { getAdminClient } from "../_shared/supabase.ts";

interface CancelOrderRequest {
  order_id: string;
  reason?: string;
}

const CANCELLABLE_STATUSES = ["pending", "confirmed", "preparing"];

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authError } = await requireAuth(req);
  if (authError) return authError;

  try {
    const { order_id, reason }: CancelOrderRequest = await req.json();

    if (!order_id) {
      return errorResponse("VALIDATION_ERROR", "order_id is required.");
    }

    const supabase = getAdminClient();

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, customer_id, shop_id, status, payment_status, payment_method, total_amount, razorpay_payment_id")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return errorResponse("ORDER_NOT_FOUND", "Order not found.", 404);
    }

    // Only customer or admin can cancel
    const isAdmin = user!.role === "admin";
    if (!isAdmin && order.customer_id !== user!.id) {
      return errorResponse("FORBIDDEN", "You cannot cancel this order.", 403);
    }

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return errorResponse(
        "VALIDATION_ERROR",
        `Order cannot be cancelled in status: ${order.status}. Only ${CANCELLABLE_STATUSES.join(", ")} orders can be cancelled.`,
        422
      );
    }

    // Cancel the order
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_reason: reason ?? "Cancelled by customer",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateErr) {
      return errorResponse("UPDATE_FAILED", "Failed to cancel order.", 500);
    }

    // Restore stock for all items
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", order_id);

    if (items) {
      for (const item of items) {
        // Atomic stock restore
        await supabase
          .from("products")
          .update({
            stock: supabase.rpc("increment_stock", {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            }),
          })
          .eq("id", item.product_id);

        // Simpler fallback: direct increment
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();

        if (product) {
          await supabase
            .from("products")
            .update({ stock: product.stock + item.quantity })
            .eq("id", item.product_id);
        }
      }
    }

    // Notify shop
    const { data: shop } = await supabase
      .from("shops")
      .select("owner_id")
      .eq("id", order.shop_id)
      .single();

    if (shop?.owner_id) {
      await supabase.from("notifications").insert({
        user_id: shop.owner_id,
        title: "Order Cancelled",
        body: `Order has been cancelled. Reason: ${reason ?? "Customer request"}`,
        type: "ORDER_UPDATE",
        data: { order_id },
      });
    }

    // Notify customer
    await supabase.from("notifications").insert({
      user_id: order.customer_id,
      title: "Order Cancelled",
      body: order.payment_status === "paid"
        ? "Your order has been cancelled. Refund will be initiated within 5-7 business days."
        : "Your order has been cancelled.",
      type: "ORDER_UPDATE",
      data: { order_id },
    });

    // Initiate refund for paid ONLINE orders
    let refundInitiated = false;
    if (order.payment_status === "paid" && order.payment_method === "ONLINE" && order.razorpay_payment_id) {
      refundInitiated = await initiateRazorpayRefund(
        supabase,
        order.razorpay_payment_id,
        order.total_amount,
        order_id
      );
    }

    return successResponse({
      success: true,
      refund_initiated: refundInitiated,
    });
  } catch (err) {
    console.error("cancel-order error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to cancel order.", 500);
  }
});

// deno-lint-ignore no-explicit-any
async function initiateRazorpayRefund(supabase: any, paymentId: string, amount: number, orderId: string): Promise<boolean> {
  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    const resp = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // paise
        notes: { order_id: orderId, reason: "Order cancelled" },
      }),
    });

    if (resp.ok) {
      await supabase
        .from("orders")
        .update({ payment_status: "refunded" })
        .eq("id", orderId);
      return true;
    }

    const err = await resp.json();
    console.error("Razorpay refund error:", err);
    return false;
  } catch (e) {
    console.error("Refund initiation error:", e);
    return false;
  }
}
