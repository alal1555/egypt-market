import { NextResponse } from "next/server";
import { getClientIp, isAkedlyConfigured, sendAkedlyOtp } from "@/lib/akedly";
import { getUserFromBearerToken } from "@/lib/supabase-admin";
import { normalizeEgyptPhone } from "@/lib/wallet";

type SendBody = {
  phoneNumber?: string;
  powSolution?: { challengeToken?: string; nonce?: number };
  turnstileToken?: string;
};

export async function POST(request: Request) {
  try {
    if (!isAkedlyConfigured()) {
      return NextResponse.json({ error: "akedly_not_configured" }, { status: 503 });
    }

    const user = await getUserFromBearerToken(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as SendBody;
    const rawPhone = body.phoneNumber?.trim();
    if (!rawPhone) {
      return NextResponse.json({ error: "phone_required" }, { status: 400 });
    }

    const phoneNumber = normalizeEgyptPhone(rawPhone);
    if (!/^\+20(10|11|12|15)\d{8}$/.test(phoneNumber)) {
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }

    const challengeToken = body.powSolution?.challengeToken;
    const nonce = body.powSolution?.nonce;
    if (!challengeToken || typeof nonce !== "number") {
      return NextResponse.json({ error: "invalid_pow_solution" }, { status: 400 });
    }

    const result = await sendAkedlyOtp({
      phoneNumber,
      powSolution: { challengeToken, nonce },
      turnstileToken: body.turnstileToken,
      clientIp: getClientIp(request),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("akedly send error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "send_failed" },
      { status: 502 },
    );
  }
}
