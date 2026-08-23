/** My ads list via Supabase REST — avoids supabase-js auth lock after posting. */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function authHeaders(accessToken: string): Record<string, string> {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
}

export type MyAdRow = {
  id: string;
  title: string;
  price: number;
  location: string;
  description?: string | null;
  seller_phone?: string | null;
  category_slug: string;
  images: string[];
  status: string;
  attributes?: Record<string, unknown>;
  created_at: string;
  expires_at?: string | null;
  listing_type?: string | null;
  auction_status?: string | null;
  auction_current_bid?: number | null;
  auction_bid_count?: number | null;
  auction_ends_at?: string | null;
};

const MY_ADS_SELECT =
  "id,title,price,location,description,seller_phone,category_slug,images,status,attributes,created_at,expires_at,listing_type,auction_status,auction_current_bid,auction_bid_count,auction_ends_at";

export async function restFetchMyAds(accessToken: string, userId: string): Promise<MyAdRow[]> {
  const url =
    `${supabaseUrl}/rest/v1/ads` +
    `?select=${MY_ADS_SELECT}` +
    `&user_id=eq.${encodeURIComponent(userId)}` +
    `&order=created_at.desc`;

  const res = await fetch(url, {
    headers: authHeaders(accessToken),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) return [];
  return (await res.json()) as MyAdRow[];
}

export async function restDeleteMyAd(accessToken: string, adId: string): Promise<boolean> {
  const res = await fetch(`${supabaseUrl}/rest/v1/ads?id=eq.${encodeURIComponent(adId)}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
    signal: AbortSignal.timeout(15_000),
  });
  return res.ok;
}
