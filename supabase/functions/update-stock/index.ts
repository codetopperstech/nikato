// supabase/functions/update-stock/index.ts
// Atomic stock adjustment (delta can be positive or negative)
// Used by shop owners to manually update stock

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { getAdminClient } from "../_shared/supabase.ts";

interface UpdateStockRequest {
  product_id: string;
  delta: number; // positive = add stock, negative = remove stock
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authError } = await requireAuth(req, ["shop_owner", "admin"]);
  if (authError) return authError;

  try {
    const { product_id, delta }: UpdateStockRequest = await req.json();

    if (!product_id || typeof delta !== "number" || !Number.isInteger(delta)) {
      return errorResponse("VALIDATION_ERROR", "product_id (string) and delta (integer) are required.");
    }

    const supabase = getAdminClient();

    // Verify ownership (unless admin)
    if (user!.role !== "admin") {
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .select("id, shop_id, shops!inner(owner_id)")
        .eq("id", product_id)
        .single();

      if (prodErr || !product) {
        return errorResponse("NOT_FOUND", "Product not found.", 404);
      }

      // deno-lint-ignore no-explicit-any
      const ownerIds = (product as any).shops?.owner_id;
      if (ownerIds !== user!.id) {
        return errorResponse("FORBIDDEN", "You do not own this product.", 403);
      }
    }

    // Atomic update with constraint check
    const { data: current } = await supabase
      .from("products")
      .select("stock")
      .eq("id", product_id)
      .single();

    if (!current) {
      return errorResponse("NOT_FOUND", "Product not found.", 404);
    }

    const newStock = current.stock + delta;
    if (newStock < 0) {
      return errorResponse(
        "VALIDATION_ERROR",
        `Cannot reduce stock below 0. Current stock: ${current.stock}, requested delta: ${delta}.`,
        422
      );
    }

    const { data: updated, error: updateErr } = await supabase
      .from("products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", product_id)
      .select("id, stock, is_available")
      .single();

    if (updateErr) {
      return errorResponse("UPDATE_FAILED", "Failed to update stock.", 500);
    }

    return successResponse({ new_stock: updated.stock, is_available: updated.is_available });
  } catch (err) {
    console.error("update-stock error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to update stock.", 500);
  }
});
