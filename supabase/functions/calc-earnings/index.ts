// supabase/functions/calc-earnings/index.ts
// Aggregates delivery partner earnings for a date range

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { getAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authError } = await requireAuth(req, ["delivery", "admin"]);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const partnerIdParam = url.searchParams.get("partner_id");
    const from = url.searchParams.get("from"); // ISO date e.g. 2025-05-01
    const to = url.searchParams.get("to");     // ISO date e.g. 2025-05-31

    // Delivery partners can only query their own earnings
    const partnerId =
      user!.role === "admin" ? (partnerIdParam ?? user!.id) : user!.id;

    if (!from || !to) {
      return errorResponse("VALIDATION_ERROR", "from and to query params (ISO dates) are required.");
    }

    const supabase = getAdminClient();

    // Fetch completed delivery assignments in range
    const { data: assignments, error: assignErr } = await supabase
      .from("delivery_assignments")
      .select(`
        id, delivery_fee, delivered_at, status,
        orders!inner (
          id, order_number, total_amount, created_at, shop_id,
          shops!inner (name)
        )
      `)
      .eq("delivery_partner_id", partnerId)
      .eq("status", "delivered")
      .gte("delivered_at", `${from}T00:00:00Z`)
      .lte("delivered_at", `${to}T23:59:59Z`)
      .order("delivered_at", { ascending: false });

    if (assignErr) {
      return errorResponse("QUERY_ERROR", "Failed to fetch earnings.", 500);
    }

    const breakdown = (assignments ?? []).map((a) => ({
      assignment_id: a.id,
      // deno-lint-ignore no-explicit-any
      order_number: (a.orders as any).order_number,
      // deno-lint-ignore no-explicit-any
      shop_name: (a.orders as any).shops?.name ?? "Unknown",
      delivery_fee: a.delivery_fee,
      delivered_at: a.delivered_at,
    }));

    const total = breakdown.reduce((sum, b) => sum + Number(b.delivery_fee), 0);

    return successResponse({
      partner_id: partnerId,
      from,
      to,
      total: parseFloat(total.toFixed(2)),
      count: breakdown.length,
      breakdown,
    });
  } catch (err) {
    console.error("calc-earnings error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to calculate earnings.", 500);
  }
});
