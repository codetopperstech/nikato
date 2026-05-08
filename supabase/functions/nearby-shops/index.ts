// supabase/functions/nearby-shops/index.ts
// Returns shops within radius using PostGIS ST_DWithin

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase.ts";

interface NearbyShopsRequest {
  lat: number;
  lng: number;
  radius_km?: number; // default 5
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const body: NearbyShopsRequest = await req.json();
    const { lat, lng, radius_km = 5 } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return errorResponse("VALIDATION_ERROR", "lat and lng are required numbers.");
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return errorResponse("VALIDATION_ERROR", "Invalid coordinates.");
    }

    const radiusM = Math.min(radius_km, 50) * 1000; // cap at 50km

    const supabase = getAdminClient();

    const { data: shops, error } = await supabase.rpc("nearby_shops", {
      p_lat: lat,
      p_lng: lng,
      p_radius_m: radiusM,
    });

    if (error) {
      console.error("nearby_shops RPC error:", error);
      return errorResponse("QUERY_ERROR", "Failed to fetch nearby shops", 500);
    }

    return successResponse({ shops: shops ?? [] });
  } catch (err) {
    console.error("nearby-shops error:", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }
});
