// supabase/functions/admin-create-user/index.ts
// Admin creates shop_owner or delivery partner accounts

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { getAdminClient } from "../_shared/supabase.ts";

interface AdminCreateUserRequest {
  phone: string;
  role: "shop_owner" | "delivery";
  full_name: string;
  // For shop_owner only
  shop?: {
    name: string;
    phone: string;
    address_line: string;
    city: string;
    pincode: string;
    lat: number;
    lng: number;
    delivery_radius_km?: number;
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authError } = await requireAuth(req, "admin");
  if (authError) return authError;

  try {
    const body: AdminCreateUserRequest = await req.json();
    const { phone, role, full_name, shop } = body;

    // Validate
    const e164 = /^\+[1-9]\d{6,14}$/;
    if (!phone || !e164.test(phone)) {
      return errorResponse("VALIDATION_ERROR", "Invalid phone number (E.164 format required).");
    }
    if (!["shop_owner", "delivery"].includes(role)) {
      return errorResponse("VALIDATION_ERROR", "role must be shop_owner or delivery.");
    }
    if (!full_name?.trim()) {
      return errorResponse("VALIDATION_ERROR", "full_name is required.");
    }
    if (role === "shop_owner" && !shop) {
      return errorResponse("VALIDATION_ERROR", "shop details are required for shop_owner role.");
    }

    const supabase = getAdminClient();

    // Check if phone already registered
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, phone")
      .eq("phone", phone)
      .single();

    if (existing) {
      return errorResponse("CONFLICT", "A user with this phone number already exists.", 409);
    }

    // Create auth user (no password — they'll use OTP)
    const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
      phone,
      phone_confirm: true,
      user_metadata: { full_name, role },
    });

    if (createErr || !authUser.user) {
      console.error("Auth user creation error:", createErr);
      return errorResponse("CREATE_FAILED", "Failed to create auth user.", 500);
    }

    // Update profile with role and name (handle_new_user trigger creates the row)
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ full_name, role })
      .eq("id", authUser.user.id);

    if (profileErr) {
      console.error("Profile update error:", profileErr);
    }

    let shopId: string | null = null;

    // Create shop record for shop_owner
    if (role === "shop_owner" && shop) {
      const { data: newShop, error: shopErr } = await supabase
        .from("shops")
        .insert({
          owner_id: authUser.user.id,
          name: shop.name,
          phone: shop.phone,
          address_line: shop.address_line,
          city: shop.city,
          pincode: shop.pincode,
          lat: shop.lat,
          lng: shop.lng,
          delivery_radius_km: shop.delivery_radius_km ?? 5.0,
          is_approved: false, // admin must explicitly approve
        })
        .select("id")
        .single();

      if (shopErr) {
        console.error("Shop creation error:", shopErr);
        // Don't fail the whole request — user created, shop can be added later
      } else {
        shopId = newShop?.id ?? null;
      }
    }

    // Create delivery_locations row for delivery partners
    if (role === "delivery") {
      await supabase.from("delivery_locations").insert({
        delivery_partner_id: authUser.user.id,
        lat: 0,
        lng: 0,
        is_online: false,
      });
    }

    return successResponse(
      {
        user_id: authUser.user.id,
        phone,
        role,
        shop_id: shopId,
      },
      201
    );
  } catch (err) {
    console.error("admin-create-user error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to create user.", 500);
  }
});
