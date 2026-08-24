/** Post-ad flow via Supabase REST — avoids supabase-js auth lock on RPC/storage. */

import { AD_POST_PRICE_EGP } from "@/constants/adPricing";
import type { CanPostResult, ConsumeResult } from "@/lib/wallet";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function authHeaders(accessToken: string, extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: supabaseAnonKey,
    ...extra,
  };
}

async function throwApiError(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const msg =
    (typeof body.message === "string" && body.message) ||
    (typeof body.error === "string" && body.error) ||
    (typeof body.msg === "string" && body.msg) ||
    fallback;
  throw new Error(msg);
}

export async function restCanPostAd(
  accessToken: string,
  price: number = AD_POST_PRICE_EGP,
): Promise<CanPostResult> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/can_post_ad`, {
    method: "POST",
    headers: authHeaders(accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({ p_price: price }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) await throwApiError(res, "Credit check failed");
  return (await res.json()) as CanPostResult;
}

export async function restCanPostAuction(
  accessToken: string,
  price: number = AD_POST_PRICE_EGP,
): Promise<CanPostResult> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/can_post_auction`, {
    method: "POST",
    headers: authHeaders(accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({ p_price: price }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) await throwApiError(res, "Credit check failed");
  return (await res.json()) as CanPostResult;
}

export async function restUploadAdImage(
  accessToken: string,
  userId: string,
  file: File,
  index: number,
): Promise<string> {
  const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
  const objectPath = `ad-photos/${userId}/${Date.now()}-${index}-${safeName}`;
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");

  const res = await fetch(`${supabaseUrl}/storage/v1/object/ad-images/${encodedPath}`, {
    method: "POST",
    headers: authHeaders(accessToken, {
      "Content-Type": file.type || "application/octet-stream",
    }),
    body: file,
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) await throwApiError(res, "Image upload failed");

  return `${supabaseUrl}/storage/v1/object/public/ad-images/${encodedPath}`;
}

export type RestCreateAdInput = {
  user_id: string;
  title: string;
  price: number;
  location: string;
  description: string;
  category_slug: string;
  attributes: Record<string, unknown>;
  images: string[];
  seller_phone: string;
  status: "pending";
  listing_type?: "fixed" | "auction";
  auction_bid_increment?: number | null;
  auction_reserve_price?: number | null;
  auction_duration_hours?: number | null;
  auction_status?: string | null;
};

export async function restCreateAd(
  accessToken: string,
  input: RestCreateAdInput,
): Promise<{ id: string }> {
  const res = await fetch(`${supabaseUrl}/rest/v1/ads`, {
    method: "POST",
    headers: authHeaders(accessToken, {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) await throwApiError(res, "Failed to create ad");

  const rows = (await res.json()) as { id: string }[];
  const ad = rows[0];
  if (!ad?.id) throw new Error("Failed to create ad");
  return { id: ad.id };
}

export async function restConsumeAdCredit(
  accessToken: string,
  adId: string,
  price: number = AD_POST_PRICE_EGP,
): Promise<ConsumeResult> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_ad_credit`, {
    method: "POST",
    headers: authHeaders(accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({ p_ad_id: adId, p_price: price }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) await throwApiError(res, "Failed to charge ad credit");
  return (await res.json()) as ConsumeResult;
}

export async function restDeleteAd(accessToken: string, adId: string): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/ads?id=eq.${encodeURIComponent(adId)}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
    signal: AbortSignal.timeout(15_000),
  });
}
