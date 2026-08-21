/** Auction bidding via Supabase REST (avoids supabase-js auth lock). */

import type { AuctionAdFields } from "@/constants/auction";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type PlaceBidResult =
  | {
      ok: true;
      amount: number;
      auction_ends_at: string;
      bid_count: number;
      min_next_bid: number;
    }
  | { ok: false; error: string; min_bid?: number };

export type AuctionBidRow = {
  id: string;
  ad_id: string;
  user_id: string;
  amount: number;
  created_at: string;
};

function headers(accessToken?: string, extra?: Record<string, string>): Record<string, string> {
  const token = accessToken ?? supabaseAnonKey;
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...extra,
  };
}

export async function restCloseExpiredAuctions(): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/rpc/close_expired_auctions`, {
    method: "POST",
    headers: headers(undefined, { "Content-Type": "application/json" }),
    body: "{}",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => undefined);
}

export async function restPlaceAuctionBid(
  accessToken: string,
  adId: string,
  amount: number,
): Promise<PlaceBidResult> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/place_auction_bid`, {
    method: "POST",
    headers: headers(accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({ p_ad_id: adId, p_amount: amount }),
    signal: AbortSignal.timeout(20_000),
  });

  const data = (await res.json().catch(() => ({}))) as PlaceBidResult;
  if (!res.ok) {
    const msg = (data as { message?: string }).message;
    return { ok: false, error: msg || "bid_failed" };
  }
  return data;
}

export async function fetchAuctionBids(adId: string, limit = 10): Promise<AuctionBidRow[]> {
  const url =
    `${supabaseUrl}/rest/v1/auction_bids` +
    `?select=id,ad_id,user_id,amount,created_at` +
    `&ad_id=eq.${encodeURIComponent(adId)}` +
    `&order=amount.desc,created_at.desc` +
    `&limit=${limit}`;

  const res = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(12_000) });
  if (!res.ok) return [];
  return (await res.json()) as AuctionBidRow[];
}

export function mergeAuctionFields(
  base: Record<string, unknown>,
  listingType: "fixed" | "auction",
  auction: {
    bidIncrement: number;
    reservePrice: number | null;
    durationHours: number;
  },
): Record<string, unknown> {
  if (listingType === "fixed") {
    return {
      ...base,
      listing_type: "fixed",
      auction_status: null,
      auction_bid_increment: null,
      auction_reserve_price: null,
      auction_duration_hours: null,
    };
  }

  return {
    ...base,
    listing_type: "auction",
    auction_status: "pending",
    auction_bid_increment: auction.bidIncrement,
    auction_reserve_price: auction.reservePrice,
    auction_duration_hours: auction.durationHours,
  };
}

export type AdWithAuction = AuctionAdFields & {
  id: string;
  price: number;
  user_id: string;
  title: string;
  status: string;
  category_slug: string;
  location: string;
  description?: string | null;
  images?: string[];
  seller_phone?: string | null;
  attributes?: Record<string, unknown>;
};
