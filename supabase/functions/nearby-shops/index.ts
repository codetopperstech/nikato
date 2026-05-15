import { handleCors, getCorsHeaders, errorResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const corsHeaders = getCorsHeaders(req);

  try {
    const { lat, lng, radius_km = 5 } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ data: null, error: { code: "VALIDATION_ERROR", message: "lat and lng required" } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = getAdminClient();
    const { data: shops, error } = await supabase.rpc("nearby_shops", {
      p_lat: lat, p_lng: lng, p_radius_m: Math.min(radius_km, 50) * 1000,
    });

    if (error) {
      console.error("nearby_shops RPC error:", error);
      return new Response(JSON.stringify({ data: null, error: { code: "QUERY_ERROR", message: error.message } }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ data: { shops: shops ?? [] }, error: null }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ data: null, error: { code: "INTERNAL_ERROR", message: String(err) } }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
