import { NextResponse } from "next/server";
import {
  TOP_UP_BALANCE_VALID_DAYS,
  TOP_UP_MIN_EGP,
  TOP_UP_PRESETS_EGP,
} from "@/constants/adPricing";
import {
  buildPaymobBillingData,
  isPaymobConfigured,
  paymobAuthToken,
  paymobIframeUrl,
  paymobPaymentKey,
  paymobRegisterOrder,
} from "@/lib/paymob";
import { createSupabaseAdmin, getSiteUrl, getUserFromBearerToken } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    if (!isPaymobConfigured()) {
      return NextResponse.json({ error: "paymob_not_configured" }, { status: 503 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "server_misconfigured" }, { status: 503 });
    }

    const user = await getUserFromBearerToken(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as { amount?: number };
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount < TOP_UP_MIN_EGP) {
      return NextResponse.json(
        { error: "invalid_amount", min: TOP_UP_MIN_EGP, presets: TOP_UP_PRESETS_EGP },
        { status: 400 },
      );
    }

    if (!TOP_UP_PRESETS_EGP.includes(amount as (typeof TOP_UP_PRESETS_EGP)[number])) {
      return NextResponse.json(
        { error: "invalid_amount", min: TOP_UP_MIN_EGP, presets: TOP_UP_PRESETS_EGP },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("phone_verified")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "profile_not_found" }, { status: 400 });
    }

    if (!profile.phone_verified) {
      return NextResponse.json({ error: "phone_not_verified" }, { status: 403 });
    }

    const amountCents = Math.round(amount * 100);
    const { data: topUp, error: insertError } = await admin
      .from("wallet_top_ups")
      .insert({
        user_id: user.id,
        amount,
        amount_cents: amountCents,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !topUp) {
      return NextResponse.json({ error: insertError?.message || "top_up_create_failed" }, { status: 500 });
    }

    const authToken = await paymobAuthToken();
    const order = await paymobRegisterOrder({
      authToken,
      amountCents,
      merchantOrderId: topUp.id,
    });

    await admin
      .from("wallet_top_ups")
      .update({ provider_order_id: String(order.id) })
      .eq("id", topUp.id);

    const siteUrl = getSiteUrl(request);
    const redirectUrl = `${siteUrl}/wallet/top-up/result?top_up_id=${topUp.id}`;
    const paymentToken = await paymobPaymentKey({
      authToken,
      amountCents,
      orderId: order.id,
      billingData: buildPaymobBillingData({
        email: user.email || "user@yaddii.app",
        phone: (user.user_metadata?.phone_number as string) || (user.phone as string),
        fullName: user.user_metadata?.full_name as string,
      }),
      redirectUrl,
    });

    return NextResponse.json({
      topUpId: topUp.id,
      amount,
      iframeUrl: paymobIframeUrl(paymentToken),
      balanceValidDays: TOP_UP_BALANCE_VALID_DAYS,
    });
  } catch (err) {
    console.error("top-up create error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "top_up_failed" },
      { status: 500 },
    );
  }
}
