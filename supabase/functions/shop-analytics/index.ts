// supabase/functions/shop-analytics/index.ts
// Returns revenue and order analytics for a shop over a date range

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { getAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authError } = await requireAuth(req, ["shop_owner", "admin"]);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const shopIdParam = url.searchParams.get("shop_id");
    const from = url.searchParams.get("from"); // e.g. 2025-05-01
    const to = url.searchParams.get("to");     // e.g. 2025-05-31

    if (!from || !to) {
      return errorResponse("VALIDATION_ERROR", "from and to query params are required.");
    }

    const supabase = getAdminClient();

    // Resolve shop_id
    let shopId = shopIdParam;
    if (!shopId) {
      if (user!.role === "admin") {
        return errorResponse("VALIDATION_ERROR", "Admin must provide shop_id.");
      }
      // Fetch shop_owner's shop
      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user!.id)
        .single();

      if (!shop) {
        return errorResponse("NOT_FOUND", "Shop not found for this owner.", 404);
      }
      shopId = shop.id;
    }

    // Verify ownership (unless admin)
    if (user!.role !== "admin") {
      const { data: shop } = await supabase
        .from("shops")
        .select("owner_id")
        .eq("id", shopId)
        .single();

      if (!shop || shop.owner_id !== user!.id) {
        return errorResponse("FORBIDDEN", "You do not own this shop.", 403);
      }
    }

    // Fetch daily analytics from shop_analytics table
    const { data: dailyStats, error: statsErr } = await supabase
      .from("shop_analytics")
      .select("date, orders_count, revenue, cancelled")
      .eq("shop_id", shopId)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true });

    if (statsErr) {
      return errorResponse("QUERY_ERROR", "Failed to fetch analytics.", 500);
    }

    // Summary aggregates
    const totalRevenue = (dailyStats ?? []).reduce((s, d) => s + Number(d.revenue), 0);
    const totalOrders = (dailyStats ?? []).reduce((s, d) => s + d.orders_count, 0);
    const totalCancelled = (dailyStats ?? []).reduce((s, d) => s + d.cancelled, 0);

    // Recent orders for context
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, order_number, status, total_amount, created_at")
      .eq("shop_id", shopId)
      .gte("created_at", `${from}T00:00:00Z`)
      .lte("created_at", `${to}T23:59:59Z`)
      .order("created_at", { ascending: false })
      .limit(10);

    return successResponse({
      shop_id: shopId,
      from,
      to,
      summary: {
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_orders: totalOrders,
        total_cancelled: totalCancelled,
        avg_daily_revenue:
          dailyStats && dailyStats.length > 0
            ? parseFloat((totalRevenue / dailyStats.length).toFixed(2))
            : 0,
      },
      chart_data: dailyStats ?? [],
      recent_orders: recentOrders ?? [],
    });
  } catch (err) {
    console.error("shop-analytics error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch analytics.", 500);
  }
});
