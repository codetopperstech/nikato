// supabase/functions/send-otp/index.ts
// Triggers Supabase phone OTP for the given phone number

import { corsHeaders, handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase.ts";

interface SendOtpRequest {
  phone: string; // E.164 format: +91XXXXXXXXXX
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { phone }: SendOtpRequest = await req.json();

    // Validate E.164 format
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!phone || !e164Regex.test(phone)) {
      return errorResponse("VALIDATION_ERROR", "Invalid phone number. Use E.164 format (+91XXXXXXXXXX).");
    }

    const supabase = getAdminClient();

    const { error } = await supabase.auth.admin.generateLink({
      type: "phone_change",
      phone,
    });

    // Use signInWithOtp instead — admin generateLink doesn't work for phone
    // Trigger via the standard Supabase auth flow
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const url = Deno.env.get("SUPABASE_URL")!;

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const anonClient = createClient(url, anonKey);

    const { data, error: otpError } = await anonClient.auth.signInWithOtp({ phone });

    if (otpError) {
      console.error("OTP error:", otpError);
      return errorResponse("OTP_FAILED", otpError.message, 400);
    }

    return successResponse({ message: "OTP sent successfully", message_id: data }, 200);
  } catch (err) {
    console.error("send-otp error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to send OTP", 500);
  }
});
