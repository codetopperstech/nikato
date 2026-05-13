// supabase/functions/_shared/cors.ts
// Dynamic CORS — allows nikato.in, nikato.vercel.app, all vercel previews, localhost

const ALLOWED_ORIGINS = [
  "https://nikato.in",
  "https://www.nikato.in",
  "https://nikato.vercel.app",
];

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https:\/\/nikato-[a-z0-9]+-codetopperstech-4484s-projects\.vercel\.app$/.test(origin) ||
    /^http:\/\/localhost(:\d+)?$/.test(origin);
  return isAllowed ? origin : "https://nikato.in";
}

export function getCorsHeaders(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  };
}

// Legacy export kept for backward compat (uses wildcard fallback)
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://nikato.in",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

/** Handle pre-flight OPTIONS requests */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }
  return null;
}

/** Wrap a JSON response with CORS headers */
export function jsonResponse(
  data: unknown,
  status = 200,
  req?: Request
): Response {
  const headers = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

/** Standard success envelope */
export function successResponse(data: unknown, status = 200, req?: Request): Response {
  return jsonResponse({ data, error: null }, status, req);
}

/** Standard error envelope */
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  req?: Request
): Response {
  return jsonResponse({ data: null, error: { code, message } }, status, req);
}
