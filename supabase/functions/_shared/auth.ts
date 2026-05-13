// supabase/functions/_shared/auth.ts
// JWT verification helpers for Edge Functions

import { getUserClient } from "./supabase.ts";
import { errorResponse, getCorsHeaders } from "./cors.ts";

export interface AuthUser {
  id: string;
  role: string;
  phone: string;
}

/**
 * Verifies the JWT from the Authorization header.
 * Returns the authenticated user or an error Response.
 */
export async function requireAuth(
  req: Request,
  requiredRole?: string | string[]
): Promise<{ user: AuthUser; error: null } | { user: null; error: Response }> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return {
      user: null,
      error: errorResponse("UNAUTHORIZED", "Missing authorization header", 401, req),
    };
  }

  const client = getUserClient(authHeader);
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: errorResponse("UNAUTHORIZED", "Invalid or expired token", 401, req),
    };
  }

  // Role check: first from app_metadata (set by admin), then user_metadata, then default
  const role: string =
    (user.app_metadata?.user_role as string) ??
    (user.user_metadata?.role as string) ??
    "customer";

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(role)) {
      return {
        user: null,
        error: errorResponse(
          "FORBIDDEN",
          `Requires role: ${allowed.join(" or ")}`,
          403,
          req
        ),
      };
    }
  }

  return {
    user: {
      id: user.id,
      role,
      phone: user.phone ?? "",
    },
    error: null,
  };
}
