import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TELEGRAM_API = "https://api.telegram.org/bot";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

function jsonResponse(status: number, payload: Record<string, JsonValue>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
      return jsonResponse(500, { ok: false, error: "Supabase env not configured" });
    }
    if (!telegramToken) {
      console.error("TELEGRAM_BOT_TOKEN is not configured");
      return jsonResponse(500, { ok: false, error: "Bot token not configured" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(401, { ok: false, error: "Missing Authorization header" });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
    if (userError || !user) {
      console.error("Auth error", userError);
      return jsonResponse(401, { ok: false, error: "Unauthorized" });
    }

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError) {
      console.error("Role check error", roleError);
      return jsonResponse(500, { ok: false, error: "Role check failed" });
    }

    if (!isAdmin) {
      return jsonResponse(403, { ok: false, error: "Forbidden" });
    }

    const desiredUrl = `${supabaseUrl}/functions/v1/telegram-bot`;
    console.log("Setting Telegram webhook to:", desiredUrl);

    const beforeRes = await fetch(`${TELEGRAM_API}${telegramToken}/getWebhookInfo`);
    const before = await beforeRes.json().catch(() => null);

    const setRes = await fetch(`${TELEGRAM_API}${telegramToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: desiredUrl,
        allowed_updates: ["message"],
        drop_pending_updates: true,
      }),
    });

    const set = await setRes.json().catch(() => null);

    const afterRes = await fetch(`${TELEGRAM_API}${telegramToken}/getWebhookInfo`);
    const after = await afterRes.json().catch(() => null);

    return jsonResponse(200, {
      ok: true,
      desiredUrl,
      before: (before ?? null) as unknown as JsonValue,
      set: (set ?? null) as unknown as JsonValue,
      after: (after ?? null) as unknown as JsonValue,
    });
  } catch (error) {
    console.error("telegram-webhook-setup error:", error);
    return jsonResponse(500, { ok: false, error: (error as Error).message });
  }
});
