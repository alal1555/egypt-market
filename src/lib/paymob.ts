/** Paymob Accept — server-side only (API routes). */

import { createHmac } from "crypto";

const PAYMOB_BASE = "https://accept.paymob.com/api";

export type PaymobBillingData = {
  apartment: string;
  email: string;
  floor: string;
  first_name: string;
  last_name: string;
  street: string;
  building: string;
  phone_number: string;
  shipping_method: string;
  postal_code: string;
  city: string;
  country: string;
  state: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getPaymobConfig() {
  return {
    apiKey: requireEnv("PAYMOB_API_KEY"),
    integrationId: Number(requireEnv("PAYMOB_INTEGRATION_ID")),
    iframeId: requireEnv("PAYMOB_IFRAME_ID"),
    hmacSecret: requireEnv("PAYMOB_HMAC_SECRET"),
  };
}

export function isPaymobConfigured(): boolean {
  return Boolean(
    process.env.PAYMOB_API_KEY &&
      process.env.PAYMOB_INTEGRATION_ID &&
      process.env.PAYMOB_IFRAME_ID &&
      process.env.PAYMOB_HMAC_SECRET,
  );
}

async function paymobFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${PAYMOB_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as T & { detail?: string };
  if (!response.ok) {
    const detail = (data as { detail?: string }).detail;
    throw new Error(detail || `Paymob request failed (${response.status})`);
  }
  return data;
}

export async function paymobAuthToken(): Promise<string> {
  const { apiKey } = getPaymobConfig();
  const data = await paymobFetch<{ token: string }>("/auth/tokens", { api_key: apiKey });
  return data.token;
}

export async function paymobRegisterOrder(params: {
  authToken: string;
  amountCents: number;
  merchantOrderId: string;
}): Promise<{ id: number }> {
  return paymobFetch("/ecommerce/orders", {
    auth_token: params.authToken,
    delivery_needed: false,
    amount_cents: params.amountCents,
    currency: "EGP",
    merchant_order_id: params.merchantOrderId,
  });
}

export async function paymobPaymentKey(params: {
  authToken: string;
  amountCents: number;
  orderId: number;
  billingData: PaymobBillingData;
  redirectUrl: string;
}): Promise<string> {
  const { integrationId } = getPaymobConfig();
  const data = await paymobFetch<{ token: string }>("/acceptance/payment_keys", {
    auth_token: params.authToken,
    amount_cents: params.amountCents,
    expiration: 3600,
    order_id: params.orderId,
    billing_data: params.billingData,
    currency: "EGP",
    integration_id: integrationId,
    lock_order_when_paid: true,
    redirect_url: params.redirectUrl,
  });
  return data.token;
}

export function paymobIframeUrl(paymentToken: string): string {
  const { iframeId } = getPaymobConfig();
  return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;
}

/** Verify Paymob processed-callback HMAC (Accept API). */
export function verifyPaymobProcessedHmac(
  obj: Record<string, unknown>,
  receivedHmac: string,
): boolean {
  const { hmacSecret } = getPaymobConfig();
  const order = obj.order as Record<string, unknown> | undefined;
  const sourceData = (obj.source_data as Record<string, unknown>) || {};

  const parts = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    order?.id,
    obj.owner,
    obj.pending,
    sourceData.pan,
    sourceData.sub_type,
    sourceData.type,
    obj.success,
  ];

  const message = parts.map((p) => String(p ?? "")).join("");

  const calculated = createHmac("sha512", hmacSecret).update(message).digest("hex");
  return calculated === receivedHmac;
}

export function buildPaymobBillingData(input: {
  email: string;
  phone?: string | null;
  fullName?: string | null;
}): PaymobBillingData {
  const nameParts = (input.fullName || "Yaddii User").trim().split(/\s+/);
  const firstName = nameParts[0] || "Yaddii";
  const lastName = nameParts.slice(1).join(" ") || "User";
  const phone = (input.phone || "01000000000").replace(/\D/g, "").slice(-11);

  return {
    apartment: "NA",
    email: input.email,
    floor: "NA",
    first_name: firstName,
    last_name: lastName,
    street: "NA",
    building: "NA",
    phone_number: phone.startsWith("0") ? phone : `0${phone}`,
    shipping_method: "NA",
    postal_code: "NA",
    city: "Cairo",
    country: "EG",
    state: "Cairo",
  };
}
