// supabase/functions/send-notification/index.ts
// Inserts in-app notification and optionally sends FCM push

import { handleCors, successResponse, errorResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase.ts";

interface SendNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  type: "ORDER_UPDATE" | "PROMO" | "SYSTEM";
  data?: Record<string, string>;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  // This function is internal — secured by service role key in calling functions
  // No user auth check needed (it's called by other Edge Functions)

  try {
    const body: SendNotificationRequest = await req.json();
    const { user_id, title, body: notifBody, type, data } = body;

    if (!user_id || !title || !notifBody || !type) {
      return errorResponse("VALIDATION_ERROR", "user_id, title, body, and type are required.");
    }

    const supabase = getAdminClient();

    // Insert in-app notification
    const { error: insertErr } = await supabase.from("notifications").insert({
      user_id,
      title,
      body: notifBody,
      type,
      data: data ?? null,
    });

    if (insertErr) {
      console.error("Notification insert error:", insertErr);
      return errorResponse("INSERT_FAILED", "Failed to create notification.", 500);
    }

    // FCM push notification (best-effort, don't fail if push fails)
    const fcmKey = Deno.env.get("FCM_SERVER_KEY");
    if (fcmKey) {
      // Fetch user's FCM token
      const { data: profile } = await supabase
        .from("profiles")
        .select("fcm_token")
        .eq("id", user_id)
        .single();

      if (profile?.fcm_token) {
        await sendFcmPush(fcmKey, profile.fcm_token, title, notifBody, data).catch(
          (e) => console.error("FCM push failed:", e)
        );
      }
    }

    return successResponse({ sent: true });
  } catch (err) {
    console.error("send-notification error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to send notification.", 500);
  }
});

async function sendFcmPush(
  serverKey: string,
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const resp = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `key=${serverKey}`,
    },
    body: JSON.stringify({
      to: fcmToken,
      notification: { title, body },
      data: data ?? {},
      priority: "high",
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`FCM error: ${err}`);
  }
}
