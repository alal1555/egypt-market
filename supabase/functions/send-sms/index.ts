/**
 * Supabase Auth Send SMS Hook → SMS Misr OTP API (Egypt)
 *
 * Deploy: supabase functions deploy send-sms --no-verify-jwt
 * Secrets: SMSMISR_* and SEND_SMS_HOOK_SECRET (see supabase/README.md)
 */
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const SMSMISR_OTP_URL = "https://smsmisr.com/api/OTP/";
const OTP_SUCCESS_CODE = "4901";

type HookPayload = {
  user: { phone?: string };
  sms: { otp: string; phone?: string };
};

function resolvePhone(user: HookPayload["user"], sms: HookPayload["sms"]): string | undefined {
  return sms.phone ?? user.phone;
}

/** Supabase E.164 (+2010123456789) → SMS Misr (2010123456789) */
function toSmsmisrMobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  if (digits.length === 10) return `20${digits}`;
  return digits;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sendSmsmisrOtp(mobile: string, otp: string): Promise<string> {
  const username = Deno.env.get("SMSMISR_USERNAME");
  const password = Deno.env.get("SMSMISR_PASSWORD");
  const sender = Deno.env.get("SMSMISR_SENDER");
  const template = Deno.env.get("SMSMISR_TEMPLATE");
  const environment = Deno.env.get("SMSMISR_ENVIRONMENT") ?? "2";

  if (!username || !password || !sender || !template) {
    throw new Error(
      "Missing SMS Misr secrets. Set SMSMISR_USERNAME, SMSMISR_PASSWORD, SMSMISR_SENDER, SMSMISR_TEMPLATE.",
    );
  }

  const body = new URLSearchParams({
    environment,
    username,
    password,
    sender,
    mobile,
    template,
    otp,
  });

  const res = await fetch(SMSMISR_OTP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(20_000),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`SMS Misr HTTP ${res.status}: ${text}`);
  }

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`SMS Misr returned non-JSON: ${text}`);
  }

  const code = String(parsed.code ?? parsed.Code ?? "");
  if (code !== OTP_SUCCESS_CODE) {
    throw new Error(`SMS Misr error ${code || "unknown"}: ${text}`);
  }

  return text;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: { message: "Method not allowed" } }, 405);
  }

  const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
  if (!hookSecret) {
    return jsonResponse({ error: { message: "SEND_SMS_HOOK_SECRET not configured" } }, 500);
  }

  const payload = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const base64Secret = hookSecret.replace(/^v1,whsec_/, "");

  try {
    const wh = new Webhook(base64Secret);
    const { user, sms } = wh.verify(payload, headers) as HookPayload;

    const phone = resolvePhone(user, sms);
    if (!phone) {
      console.error("No phone in hook payload", { userPhone: user.phone, smsPhone: sms.phone });
      throw new Error("No phone number in hook payload (expected sms.phone or user.phone)");
    }

    const mobile = toSmsmisrMobile(phone);
    console.log(`Sending OTP to ${mobile.slice(0, 5)}…`);

    const result = await sendSmsmisrOtp(mobile, sms.otp);
    console.log("SMS Misr success:", result);

    return jsonResponse({}, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("send-sms hook failed:", message);
    return jsonResponse({ error: { message } }, 500);
  }
});
