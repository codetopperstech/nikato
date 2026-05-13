// supabase/functions/_shared/auth.ts
import { getAdminClient, getUserClient } from "./supabase.ts";
import { errorResponse } from "./cors.ts";

export interface AuthUser {
  id: string;
  role: string;
  phone: string;
}

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

  // Step 1: Verify JWT and get user id
  const userClient = getUserClient(authHeader);
  const { data: { user }, error } = await userClient.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: errorResponse("UNAUTHORIZED", "Invalid or expired token", 401, req),
    };
  }

  // Step 2: Get role from profiles table (service role client — bypasses RLS)
  const adminClient = getAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: string = profile?.role ?? "customer";

  // Step 3: Check required role
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
    user: { id: user.id, role, phone: user.phone ?? "" },
    error: null,
  };
}
