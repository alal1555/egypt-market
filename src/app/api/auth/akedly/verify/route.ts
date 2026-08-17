import { NextResponse } from "next/server";
import { isAkedlyConfigured, verifyAkedlyOtp } from "@/lib/akedly";
import { getUserFromBearerToken } from "@/lib/supabase-admin";

type VerifyBody = {
  transactionReqID?: string;
  otp?: string;
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

    const body = (await request.json()) as VerifyBody;
    const transactionReqID = body.transactionReqID?.trim();
    const otp = body.otp?.replace(/\D/g, "");

    if (!transactionReqID) {
      return NextResponse.json({ error: "transaction_required" }, { status: 400 });
    }
    if (!otp || otp.length < 4) {
      return NextResponse.json({ error: "invalid_otp" }, { status: 400 });
    }

    const result = await verifyAkedlyOtp({ transactionReqID, otp });
    if (!result.verified) {
      return NextResponse.json({ error: "verification_failed", verified: false }, { status: 400 });
    }

    return NextResponse.json({ verified: true, transactionID: result.transactionID });
  } catch (err) {
    console.error("akedly verify error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "verify_failed" },
      { status: 502 },
    );
  }
}
