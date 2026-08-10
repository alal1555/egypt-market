import { NextResponse } from "next/server";
import { TOP_UP_BALANCE_VALID_DAYS } from "@/constants/adPricing";
import { isPaymobConfigured, verifyPaymobProcessedHmac } from "@/lib/paymob";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

type PaymobCallbackBody = {
  type?: string;
  obj?: Record<string, unknown>;
  hmac?: string;
};

export async function POST(request: Request) {
  try {
    if (!isPaymobConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }

    const body = (await request.json()) as PaymobCallbackBody;
    const obj = body.obj;
    const hmac = body.hmac;

    if (!obj || !hmac) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    if (!verifyPaymobProcessedHmac(obj, hmac)) {
      console.error("Paymob webhook HMAC mismatch");
      return NextResponse.json({ error: "invalid_hmac" }, { status: 401 });
    }

    const success = Boolean(obj.success);
    const pending = Boolean(obj.pending);
    if (!success || pending) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const order = obj.order as { id?: number; merchant_order_id?: string } | undefined;
    const admin = createSupabaseAdmin();

    let topUpQuery = admin.from("wallet_top_ups").select("id, status").limit(1);

    if (order?.merchant_order_id) {
      topUpQuery = topUpQuery.eq("id", order.merchant_order_id);
    } else if (order?.id) {
      topUpQuery = topUpQuery.eq("provider_order_id", String(order.id));
    } else {
      return NextResponse.json({ error: "missing_order_reference" }, { status: 400 });
    }

    const { data: topUp, error: lookupError } = await topUpQuery.maybeSingle();
    if (lookupError || !topUp) {
      return NextResponse.json({ error: "top_up_not_found" }, { status: 404 });
    }

    const { data: credited, error: creditError } = await admin.rpc("apply_top_up", {
      p_top_up_id: topUp.id,
      p_provider_transaction_id: obj.id != null ? String(obj.id) : null,
      p_balance_valid_days: TOP_UP_BALANCE_VALID_DAYS,
    });

    if (creditError) {
      console.error("apply_top_up error:", creditError);
      return NextResponse.json({ error: creditError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result: credited });
  } catch (err) {
    console.error("top-up webhook error:", err);
    return NextResponse.json({ error: "webhook_failed" }, { status: 500 });
  }
}
