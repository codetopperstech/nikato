// supabase/functions/_shared/cors.ts
// Standard CORS headers for all Edge Functions

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_URL") ?? "https://nikato.in",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

/** Handle pre-flight OPTIONS requests */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

/** Wrap a JSON response with CORS headers */
export function jsonResponse(
  data: unknown,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Standard success envelope */
export function successResponse(data: unknown, status = 200): Response {
  return jsonResponse({ data, error: null }, status);
}

/** Standard error envelope */
export function errorResponse(
  code: string,
  message: string,
  status = 400
): Response {
  return jsonResponse({ data: null, error: { code, message } }, status);
}
