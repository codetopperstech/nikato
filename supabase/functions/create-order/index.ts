// supabase/functions/create-order/index.ts
// Validates cart, calculates totals, creates order + items, initiates payment

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { getAdminClient } from "../_shared/supabase.ts";

interface CartItem {
  product_id: string;
  quantity: number;
}

interface CreateOrderRequest {
  cart: CartItem[];
  address_id: string;
  payment_method: "COD" | "ONLINE";
  special_instructions?: string;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  // 1. Authenticate — must be a customer
  const { user, error: authError } = await requireAuth(req, "customer");
  if (authError) return authError;

  const supabase = getAdminClient();

  try {
    const body: CreateOrderRequest = await req.json();
    const { cart, address_id, payment_method, special_instructions } = body;

    // ── Validation ──────────────────────────────────────────────
    if (!cart || cart.length === 0) {
      return errorResponse("VALIDATION_ERROR", "Cart is empty.");
    }
    if (!["COD", "ONLINE"].includes(payment_method)) {
      return errorResponse("VALIDATION_ERROR", "Invalid payment method.");
    }
    if (!address_id) {
      return errorResponse("VALIDATION_ERROR", "Delivery address is required.");
    }

    // 2. Fetch delivery address
    const { data: address, error: addrErr } = await supabase
      .from("addresses")
      .select("id, lat, lng, user_id")
      .eq("id", address_id)
      .eq("user_id", user!.id)
      .single();

    if (addrErr || !address) {
      return errorResponse("VALIDATION_ERROR", "Delivery address not found or does not belong to user.");
    }

    // 3. Fetch all products in cart
    const productIds = cart.map((i) => i.product_id);
    const { data: products, error: productsErr } = await supabase
      .from("products")
      .select("id, shop_id, name, image_url, price, stock, is_available")
      .in("id", productIds);

    if (productsErr || !products) {
      return errorResponse("QUERY_ERROR", "Failed to fetch products.", 500);
    }

    // 4. Validate all products exist and are available
    for (const item of cart) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return errorResponse("VALIDATION_ERROR", `Product ${item.product_id} not found.`);
      }
      if (!product.is_available) {
        return errorResponse("OUT_OF_STOCK", `Product "${product.name}" is not available.`, 422);
      }
      if (product.stock < item.quantity) {
        return errorResponse(
          "OUT_OF_STOCK",
          `Insufficient stock for "${product.name}". Available: ${product.stock}.`,
          422
        );
      }
    }

    // 5. Ensure all products are from the same shop (single-shop cart)
    const shopIds = [...new Set(products.map((p) => p.shop_id))];
    if (shopIds.length !== 1) {
      return errorResponse("VALIDATION_ERROR", "All cart items must be from the same shop.");
    }
    const shopId = shopIds[0];

    // 6. Fetch shop — validate open + delivery available + approved
    const { data: shop, error: shopErr } = await supabase
      .from("shops")
      .select(
        "id, is_open, is_delivery_available, is_approved, min_order_amount, commission_rate, delivery_radius_km, lat, lng"
      )
      .eq("id", shopId)
      .single();

    if (shopErr || !shop) {
      return errorResponse("VALIDATION_ERROR", "Shop not found.", 404);
    }
    if (!shop.is_approved) {
      return errorResponse("SHOP_CLOSED", "This shop is not currently available.", 422);
    }
    if (!shop.is_open) {
      return errorResponse("SHOP_CLOSED", "This shop is currently closed.", 422);
    }
    if (!shop.is_delivery_available) {
      return errorResponse("NO_DELIVERY", "Delivery is not available from this shop right now.", 422);
    }

    // 7. Check delivery radius via PostGIS RPC
    const { data: inRadius, error: radiusErr } = await supabase.rpc(
      "check_delivery_availability",
      {
        p_shop_id: shopId,
        p_cust_lat: address.lat,
        p_cust_lng: address.lng,
      }
    );

    if (radiusErr || !inRadius) {
      return errorResponse(
        "NO_DELIVERY",
        "Your address is outside the shop's delivery radius.",
        422
      );
    }

    // 8. Calculate order amounts
    let subtotal = 0;
    for (const item of cart) {
      const product = products.find((p) => p.id === item.product_id)!;
      subtotal += product.price * item.quantity;
    }

    const deliveryFee = 30; // flat ₹30 — replace with distance-based if needed
    const discount = 0;
    const totalAmount = subtotal + deliveryFee - discount;

    if (totalAmount < shop.min_order_amount) {
      return errorResponse(
        "MIN_ORDER",
        `Minimum order amount is ₹${shop.min_order_amount}. Current: ₹${totalAmount}.`,
        422
      );
    }

    const commissionAmount = parseFloat((subtotal * shop.commission_rate).toFixed(2));
    const shopEarning = parseFloat((subtotal - commissionAmount).toFixed(2));
    const deliveryEarning = parseFloat((deliveryFee * 0.8).toFixed(2)); // 80% of delivery fee to partner

    // 9. Decrement stock for each product atomically
    for (const item of cart) {
      const { error: stockErr } = await supabase.rpc("decrement_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      }).single();

      // If RPC doesn't exist yet, fallback to direct update
      if (stockErr) {
        const product = products.find((p) => p.id === item.product_id)!;
        const { error: updateErr } = await supabase
          .from("products")
          .update({ stock: product.stock - item.quantity })
          .eq("id", item.product_id)
          .gte("stock", item.quantity); // atomic guard

        if (updateErr) {
          return errorResponse("OUT_OF_STOCK", `Failed to reserve stock for "${product.name}".`, 422);
        }
      }
    }

    // 10. Generate order number
    const { data: orderNumData } = await supabase.rpc("generate_order_number");
    const orderNumber = orderNumData ?? `NKT-${Date.now()}`;

    // 11. Create order + order_items in a single transaction (via RPC or sequential inserts)
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: user!.id,
        shop_id: shopId,
        delivery_address_id: address_id,
        status: "pending",
        payment_method,
        payment_status: "pending",
        subtotal: subtotal.toFixed(2),
        delivery_fee: deliveryFee.toFixed(2),
        discount: discount.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        commission_amount: commissionAmount,
        shop_earning: shopEarning,
        delivery_earning: deliveryEarning,
        special_instructions: special_instructions ?? null,
      })
      .select("id, order_number, total_amount")
      .single();

    if (orderErr || !order) {
      console.error("Order insert error:", orderErr);
      return errorResponse("ORDER_CREATE_FAILED", "Failed to create order.", 500);
    }

    // 12. Insert order items
    const orderItems = cart.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: parseFloat((product.price * item.quantity).toFixed(2)),
        product_name: product.name,
        product_image: product.image_url ?? null,
      };
    });

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) {
      console.error("Order items insert error:", itemsErr);
      // Order created but items failed — log for manual recovery
    }

    // 13. Notify shop owner
    await notifyShopOwner(supabase, shopId, order.order_number);

    // 14. If ONLINE payment — initiate Razorpay order
    if (payment_method === "ONLINE") {
      const { createRazorpayOrder } = await import("../_shared/razorpay.ts");

      const rzpOrder = await createRazorpayOrder({
        amount: Math.round(totalAmount * 100), // convert to paise
        receipt: order.order_number,
        notes: { order_id: order.id, customer_id: user!.id },
      });

      // Store razorpay_order_id
      await supabase
        .from("orders")
        .update({ razorpay_order_id: rzpOrder.id })
        .eq("id", order.id);

      // Create payment record
      await supabase.from("payments").insert({
        order_id: order.id,
        razorpay_order_id: rzpOrder.id,
        amount: totalAmount,
        currency: "INR",
        status: "created",
      });

      return successResponse(
        {
          order_id: order.id,
          order_number: order.order_number,
          razorpay_order_id: rzpOrder.id,
          key_id: Deno.env.get("RAZORPAY_KEY_ID"),
          amount: Math.round(totalAmount * 100),
          currency: "INR",
        },
        201
      );
    }

    // 15. COD — return order immediately
    return successResponse(
      {
        order_id: order.id,
        order_number: order.order_number,
        total_amount: totalAmount,
      },
      201
    );
  } catch (err) {
    console.error("create-order unhandled error:", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error creating order.", 500);
  }
});

async function notifyShopOwner(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  shopId: string,
  orderNumber: string
): Promise<void> {
  try {
    // Get shop owner id
    const { data: shop } = await supabase
      .from("shops")
      .select("owner_id")
      .eq("id", shopId)
      .single();

    if (!shop?.owner_id) return;

    await supabase.from("notifications").insert({
      user_id: shop.owner_id,
      title: "New Order Received!",
      body: `Order ${orderNumber} received. Accept within 60 seconds.`,
      type: "ORDER_UPDATE",
      data: { order_number: orderNumber },
    });
  } catch (e) {
    console.error("Failed to notify shop owner:", e);
  }
}
