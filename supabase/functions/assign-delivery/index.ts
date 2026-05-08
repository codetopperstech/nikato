// supabase/functions/assign-delivery/index.ts
// Finds nearest online delivery partner and assigns the order

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase.ts";

interface AssignDeliveryRequest {
  order_id: string;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  // This function is called internally (service role) or by payment-verify
  // No user-facing auth required — secured by service role key in caller

  try {
    const { order_id }: AssignDeliveryRequest = await req.json();

    if (!order_id) {
      return errorResponse("VALIDATION_ERROR", "order_id is required.");
    }

    const supabase = getAdminClient();

    // Fetch order + delivery address coordinates
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(`
        id, order_number, shop_id, delivery_earning,
        delivery_address_id,
        addresses!delivery_address_id (lat, lng)
      `)
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return errorResponse("ORDER_NOT_FOUND", "Order not found.", 404);
    }

    const deliveryAddress = order.addresses as { lat: number; lng: number } | null;
    if (!deliveryAddress) {
      return errorResponse("VALIDATION_ERROR", "Could not resolve delivery address coordinates.");
    }

    // Check if already assigned (idempotent)
    const { data: existing } = await supabase
      .from("delivery_assignments")
      .select("id, delivery_partner_id")
      .eq("order_id", order_id)
      .single();

    if (existing) {
      return successResponse({ partner_id: existing.delivery_partner_id, already_assigned: true });
    }

    // Find nearest online delivery partner not currently on an active delivery
    const { data: activeDeliveries } = await supabase
      .from("delivery_assignments")
      .select("delivery_partner_id")
      .in("status", ["assigned", "picked_up"]);

    const busyPartnerIds = (activeDeliveries ?? []).map((d) => d.delivery_partner_id);

    // Query online partners (excluding busy ones)
    let partnersQuery = supabase
      .from("delivery_locations")
      .select("delivery_partner_id, lat, lng")
      .eq("is_online", true);

    if (busyPartnerIds.length > 0) {
      partnersQuery = partnersQuery.not("delivery_partner_id", "in", `(${busyPartnerIds.join(",")})`);
    }

    const { data: onlinePartners, error: partnersErr } = await partnersQuery;

    if (partnersErr) {
      console.error("Partners query error:", partnersErr);
    }

    if (!onlinePartners || onlinePartners.length === 0) {
      console.warn("No online delivery partners available for order:", order_id);
      // Queue for manual assignment — no error, just no partner found
      return successResponse({ partner_id: null, queued: true });
    }

    // Find nearest partner (simple Euclidean distance — good enough for city scale)
    const nearest = onlinePartners.reduce((best, partner) => {
      const dist = Math.sqrt(
        Math.pow(partner.lat - deliveryAddress.lat, 2) +
        Math.pow(partner.lng - deliveryAddress.lng, 2)
      );
      const bestDist = Math.sqrt(
        Math.pow(best.lat - deliveryAddress.lat, 2) +
        Math.pow(best.lng - deliveryAddress.lng, 2)
      );
      return dist < bestDist ? partner : best;
    });

    const partnerId = nearest.delivery_partner_id;

    // Create delivery assignment
    const { error: assignErr } = await supabase
      .from("delivery_assignments")
      .insert({
        order_id: order.id,
        delivery_partner_id: partnerId,
        delivery_fee: order.delivery_earning,
        status: "assigned",
      });

    if (assignErr) {
      console.error("delivery_assignments insert error:", assignErr);
      return errorResponse("ASSIGNMENT_FAILED", "Failed to create delivery assignment.", 500);
    }

    // Update order with delivery partner
    await supabase
      .from("orders")
      .update({ delivery_partner_id: partnerId })
      .eq("id", order_id);

    // Notify delivery partner
    await supabase.from("notifications").insert({
      user_id: partnerId,
      title: "New Delivery!",
      body: `New delivery assigned: Order ${order.order_number}`,
      type: "ORDER_UPDATE",
      data: { order_id: order.id },
    });

    // Notify customer
    const { data: orderFull } = await supabase
      .from("orders")
      .select("customer_id")
      .eq("id", order_id)
      .single();

    if (orderFull?.customer_id) {
      await supabase.from("notifications").insert({
        user_id: orderFull.customer_id,
        title: "Delivery Partner Assigned",
        body: "A delivery partner has been assigned to your order.",
        type: "ORDER_UPDATE",
        data: { order_id: order.id },
      });
    }

    return successResponse({ partner_id: partnerId });
  } catch (err) {
    console.error("assign-delivery error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to assign delivery.", 500);
  }
});
